package app.saralo.autofill

import android.app.KeyguardManager
import android.os.CancellationSignal
import android.service.autofill.AutofillService
import android.service.autofill.FillCallback
import android.service.autofill.FillRequest
import android.service.autofill.SaveCallback
import android.service.autofill.SaveRequest
import androidx.annotation.RequiresApi

@RequiresApi(26)
class SaraloAutofillService : AutofillService() {
  override fun onFillRequest(request: FillRequest, cancellationSignal: CancellationSignal, callback: FillCallback) {
    val response = try {
      val form = Form(request.fillContexts.last().structure)
      if (form.pkg == packageName) null
      else Autofill.response(this, form, getSystemService(KeyguardManager::class.java)?.isDeviceSecure != true)
    } catch (e: Exception) {
      null
    }
    callback.onSuccess(response)
  }

  override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
    try {
      val form = Form(request.fillContexts.last().structure)
      val password = form.pass?.autofillValue?.textValue?.toString().orEmpty()
      val username = form.user?.autofillValue?.textValue?.toString().orEmpty()
      if (password.isNotEmpty() && form.pkg != packageName) Autofill.addPending(this, form, username, password)
      callback.onSuccess()
    } catch (e: Exception) {
      callback.onFailure("Saralo could not save this login")
    }
  }
}
