package com.yourcompany.posapp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.yourcompany.posapp.plugins.EpsonPrinterPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(EpsonPrinterPlugin.class);
    }
}