package app.saralo.autofill

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONArray
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object Store {
  private const val ALIAS = "saralo_autofill"

  private fun key(): SecretKey {
    val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (keyStore.getKey(ALIAS, null) as? SecretKey)?.let { return it }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(
      KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .build()
    )
    return generator.generateKey()
  }

  private fun prefs(context: Context) = context.getSharedPreferences("saralo_autofill", Context.MODE_PRIVATE)

  fun write(context: Context, name: String, text: String) {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key())
    val sealed = cipher.iv + cipher.doFinal(text.toByteArray(Charsets.UTF_8))
    prefs(context).edit().putString(name, Base64.encodeToString(sealed, Base64.NO_WRAP)).apply()
  }

  fun read(context: Context, name: String): JSONArray {
    val raw = prefs(context).getString(name, null) ?: return JSONArray()
    return try {
      val bytes = Base64.decode(raw, Base64.NO_WRAP)
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes, 0, 12))
      JSONArray(String(cipher.doFinal(bytes, 12, bytes.size - 12), Charsets.UTF_8))
    } catch (e: Exception) {
      JSONArray()
    }
  }

  fun remove(context: Context, name: String) = prefs(context).edit().remove(name).apply()
}
