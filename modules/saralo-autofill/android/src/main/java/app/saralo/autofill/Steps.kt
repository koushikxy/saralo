package app.saralo.autofill

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.HandlerThread
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

object Steps {
  private fun prefs(context: Context) = context.getSharedPreferences("saralo_steps", Context.MODE_PRIVATE)

  private fun today() = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

  private fun readCounter(context: Context): Float {
    val sensors = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val sensor = sensors.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return -1f
    val thread = HandlerThread("saralo-steps").apply { start() }
    val latch = CountDownLatch(1)
    var value = -2f
    val listener = object : SensorEventListener {
      override fun onSensorChanged(event: SensorEvent) {
        value = event.values[0]
        latch.countDown()
      }
      override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    }
    sensors.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL, Handler(thread.looper))
    latch.await(5, TimeUnit.SECONDS)
    sensors.unregisterListener(listener)
    thread.quitSafely()
    return value
  }

  @Synchronized
  fun update(context: Context): Int {
    val value = readCounter(context)
    val p = prefs(context)
    val day = today()
    val days = JSONObject(p.getString("days", null) ?: "{}")
    if (value < 0) return if (value == -1f) -1 else days.optInt(day)
    val last = p.getFloat("last", -1f)
    if (last >= 0) {
      val delta = if (value >= last) value - last else value
      days.put(day, days.optInt(day) + delta.toInt())
    }
    val old = days.keys().asSequence().toList().sorted().dropLast(60)
    old.forEach { days.remove(it) }
    p.edit().putFloat("last", value).putString("days", days.toString()).commit()
    return days.optInt(day)
  }
}

class StepWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    Steps.update(applicationContext)
    return Result.success()
  }
}
