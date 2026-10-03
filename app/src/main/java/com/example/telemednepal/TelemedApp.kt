package com.example.telemednepal

import android.app.Application
import com.example.telemednepal.data.local.AppDatabase
import com.example.telemednepal.data.repository.TelemedRepository

class TelemedApp : Application() {

    val database by lazy { AppDatabase.getInstance(this) }
    val repository by lazy { TelemedRepository(database) }

    companion object {
        lateinit var instance: TelemedApp
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }
}
