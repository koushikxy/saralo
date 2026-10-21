package app.saralo.autofill

import android.app.Activity
import android.app.KeyguardManager
import android.app.assist.AssistStructure
import android.content.Intent
import android.os.Bundle
import android.view.autofill.AutofillManager
import androidx.annotation.RequiresApi

@RequiresApi(26)
@Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
class AutofillAuthActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if (savedInstanceState != null) return
    val ask = getSystemService(KeyguardManager::class.java)?.createConfirmDeviceCredentialIntent("Saralo", "Unlock to fill your password")
    if (ask == null) done() else startActivityForResult(ask, 7)
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (resultCode == RESULT_OK) done()
    else {
      setResult(RESULT_CANCELED)
      finish()
    }
  }

  private fun done() {
    val structure = intent.getParcelableExtra<AssistStructure>(AutofillManager.EXTRA_ASSIST_STRUCTURE)
    val response = structure?.let { Autofill.response(this, Form(it), true) }
    if (response == null) setResult(RESULT_CANCELED)
    else setResult(RESULT_OK, Intent().putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT, response))
    finish()
  }
}
