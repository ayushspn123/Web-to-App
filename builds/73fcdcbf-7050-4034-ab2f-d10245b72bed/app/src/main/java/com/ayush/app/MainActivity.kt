package com.ayush.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)

        // Enable JavaScript
        webView.settings.javaScriptEnabled = true
        
        // Enable DOM storage
        webView.settings.domStorageEnabled = true
        
        // Enable zoom controls
        webView.settings.builtInZoomControls = true
        webView.settings.displayZoomControls = false
        
        // Enable local storage
        webView.settings.databaseEnabled = true
        
        // Set WebView client to handle navigation
        webView.webViewClient = WebViewClient()
        
        // Set WebChrome client for better support
        webView.webChromeClient = WebChromeClient()
        
        // Load the website
        webView.loadUrl("https://job-ai-omega.vercel.app")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
