package com.example.telemednepal.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.example.telemednepal.data.model.Appointment
import com.example.telemednepal.data.model.Doctor
import com.example.telemednepal.data.model.Hospital
import com.example.telemednepal.data.model.Prescription
import com.example.telemednepal.data.model.User

@Database(
    entities = [
        Doctor::class,
        Hospital::class,
        Appointment::class,
        Prescription::class,
        User::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun doctorDao(): DoctorDao
    abstract fun hospitalDao(): HospitalDao
    abstract fun appointmentDao(): AppointmentDao
    abstract fun prescriptionDao(): PrescriptionDao
    abstract fun userDao(): UserDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "telemed_nepal_database"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
