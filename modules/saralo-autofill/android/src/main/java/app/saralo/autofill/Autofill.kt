package app.saralo.autofill

import android.app.PendingIntent
import android.app.assist.AssistStructure
import android.app.assist.AssistStructure.ViewNode
import android.content.Context
import android.content.Intent
import android.content.IntentSender
import android.service.autofill.Dataset
import android.service.autofill.FillResponse
import android.service.autofill.SaveInfo
import android.text.InputType
import android.view.View
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import androidx.annotation.RequiresApi
import org.json.JSONArray
import org.json.JSONObject

@RequiresApi(26)
class Form(structure: AssistStructure) {
  val pkg: String = structure.activityComponent?.packageName ?: ""
  var domain: String? = null
  val user: ViewNode?
  val pass: ViewNode?
  private val texts = mutableListOf<ViewNode>()

  init {
    for (i in 0 until structure.windowNodeCount) walk(structure.getWindowNodeAt(i).rootViewNode)
    pass = texts.firstOrNull { isPassword(it) }
    user = texts.firstOrNull { !isPassword(it) && isUser(it) }
      ?: pass?.let { p -> texts.takeWhile { it !== p }.lastOrNull { !isPassword(it) } }
  }

  val ids: Array<AutofillId> get() = listOfNotNull(user?.autofillId, pass?.autofillId).toTypedArray()

  private fun walk(node: ViewNode) {
    node.webDomain?.takeIf { it.isNotBlank() }?.let { domain = it.removePrefix("www.") }
    if (node.autofillId != null && node.autofillType == View.AUTOFILL_TYPE_TEXT && node.visibility == View.VISIBLE) texts.add(node)
    for (i in 0 until node.childCount) walk(node.getChildAt(i))
  }

  private fun words(node: ViewNode): String {
    val html = node.htmlInfo?.attributes?.joinToString(" ") { "${it.first}=${it.second}" }
    val hints = node.autofillHints?.joinToString(" ")
    return listOfNotNull(node.idEntry, node.hint, node.contentDescription?.toString(), html, hints).joinToString(" ").lowercase()
  }

  private fun isPassword(node: ViewNode): Boolean {
    val type = node.inputType
    val variation = type and InputType.TYPE_MASK_VARIATION
    val kind = type and InputType.TYPE_MASK_CLASS
    val textPassword = kind == InputType.TYPE_CLASS_TEXT && (variation == InputType.TYPE_TEXT_VARIATION_PASSWORD || variation == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD || variation == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD)
    val numberPassword = kind == InputType.TYPE_CLASS_NUMBER && variation == InputType.TYPE_NUMBER_VARIATION_PASSWORD
    val htmlPassword = node.htmlInfo?.attributes?.any { it.first == "type" && it.second == "password" } == true
    return textPassword || numberPassword || htmlPassword || words(node).contains("password")
  }

  private fun isUser(node: ViewNode): Boolean {
    val variation = node.inputType and InputType.TYPE_MASK_VARIATION
    if (variation == InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS || variation == InputType.TYPE_TEXT_VARIATION_WEB_EMAIL_ADDRESS) return true
    val w = words(node)
    return listOf("user", "email", "e-mail", "login", "phone", "mobile", "account").any { w.contains(it) }
  }
}

@RequiresApi(26)
object Autofill {
  private val SKIP = setOf("com", "org", "net", "in", "co", "android", "app", "apps", "mobile", "client")

  private fun keys(title: String, website: String): List<String> {
    val host = website.lowercase().removePrefix("https://").removePrefix("http://").substringBefore("/").removePrefix("www.")
    val parts = host.split(".")
    val main = if (parts.size >= 2) parts[parts.size - 2] else ""
    val name = title.lowercase().replace(Regex("[^a-z0-9]"), "")
    return listOf(host, main, name).filter { it.length >= 3 }
  }

  private fun matches(context: Context, form: Form): List<JSONObject> {
    val target = listOfNotNull(form.domain, form.pkg).joinToString(" ").lowercase()
    val creds = Store.read(context, "creds")
    return (0 until creds.length()).map { creds.getJSONObject(it) }.filter { o ->
      keys(o.optString("title"), o.optString("website")).any { target.contains(it) }
    }
  }

  private fun row(context: Context, text: String) =
    RemoteViews(context.packageName, android.R.layout.simple_list_item_1).apply { setTextViewText(android.R.id.text1, text) }

  private fun authSender(context: Context): IntentSender {
    val intent = Intent(context, AutofillAuthActivity::class.java)
    return PendingIntent.getActivity(context, 1001, intent, PendingIntent.FLAG_CANCEL_CURRENT or PendingIntent.FLAG_MUTABLE).intentSender
  }

  @Suppress("DEPRECATION")
  private fun dataset(context: Context, form: Form, o: JSONObject): Dataset? {
    val username = o.optString("username")
    val view = row(context, "${username.ifBlank { o.optString("title") }} · Saralo")
    val builder = Dataset.Builder()
    var any = false
    val userId = form.user?.autofillId
    val passId = form.pass?.autofillId
    if (userId != null && username.isNotEmpty()) {
      builder.setValue(userId, AutofillValue.forText(username), view)
      any = true
    }
    if (passId != null) {
      builder.setValue(passId, AutofillValue.forText(o.optString("password")), view)
      any = true
    }
    return if (any) builder.build() else null
  }

  @Suppress("DEPRECATION")
  fun response(context: Context, form: Form, unlocked: Boolean): FillResponse? {
    if (form.ids.isEmpty()) return null
    val found = matches(context, form)
    val builder = FillResponse.Builder()
    var has = false
    if (found.isNotEmpty()) {
      if (unlocked) {
        found.mapNotNull { dataset(context, form, it) }.forEach {
          builder.addDataset(it)
          has = true
        }
      } else {
        builder.setAuthentication(form.ids, authSender(context), row(context, "Unlock Saralo to fill"))
        has = true
      }
    }
    val passId = form.pass?.autofillId
    if (passId != null) {
      val userId = form.user?.autofillId
      val type = SaveInfo.SAVE_DATA_TYPE_PASSWORD or (if (userId != null) SaveInfo.SAVE_DATA_TYPE_USERNAME else 0)
      val save = SaveInfo.Builder(type, arrayOf(passId)).setFlags(SaveInfo.FLAG_SAVE_ON_ALL_VIEWS_INVISIBLE)
      if (userId != null) save.setOptionalIds(arrayOf(userId))
      builder.setSaveInfo(save.build())
      has = true
    }
    return if (has) builder.build() else null
  }

  private fun appName(context: Context, pkg: String): String {
    val pm = context.packageManager
    val label = try {
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (e: Exception) {
      null
    }
    return label ?: pkg.split(".").firstOrNull { it !in SKIP }?.replaceFirstChar { it.uppercase() } ?: pkg
  }

  fun addPending(context: Context, form: Form, username: String, password: String) {
    val title = form.domain ?: appName(context, form.pkg)
    val website = form.domain?.let { "https://$it" } ?: ""
    val creds = Store.read(context, "creds")
    for (i in 0 until creds.length()) {
      val o = creds.getJSONObject(i)
      if (o.optString("username") == username && o.optString("password") == password && keys(o.optString("title"), o.optString("website")).any { (form.domain ?: form.pkg).lowercase().contains(it) }) return
    }
    val entry = JSONObject().put("title", title).put("username", username).put("password", password).put("website", website)
    val pending = Store.read(context, "pending")
    pending.put(entry)
    Store.write(context, "pending", pending.toString())
    creds.put(JSONObject(entry.toString()).put("id", "new-${System.currentTimeMillis()}"))
    Store.write(context, "creds", creds.toString())
  }
}
