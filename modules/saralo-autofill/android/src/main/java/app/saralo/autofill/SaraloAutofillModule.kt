package app.saralo.autofill

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.autofill.AutofillManager
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import expo.modules.kotlin.Promise
import java.util.concurrent.TimeUnit
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SaraloAutofillModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("SaraloAutofill")

    Function("isSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
    }

    Function("isEnabled") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && context.getSystemService(AutofillManager::class.java)?.hasEnabledAutofillServices() == true
    }

    Function("openSettings") {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE, Uri.parse("package:${context.packageName}"))
      } else {
        Intent(Settings.ACTION_SETTINGS)
      }
      try {
        context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (e: Exception) {
        context.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }

    Function("setCredentials") { json: String ->
      Store.write(context, "creds", json)
    }

    AsyncFunction("readSteps") { promise: Promise ->
      Thread { promise.resolve(Steps.update(context)) }.start()
    }

    Function("startStepTracking") {
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        "saralo-steps",
        ExistingPeriodicWorkPolicy.KEEP,
        PeriodicWorkRequestBuilder<StepWorker>(15, TimeUnit.MINUTES).build()
      )
      Unit
    }

    Function("takePending") {
      val list = Store.read(context, "pending").toString()
      Store.remove(context, "pending")
      list
    }
  }
}
