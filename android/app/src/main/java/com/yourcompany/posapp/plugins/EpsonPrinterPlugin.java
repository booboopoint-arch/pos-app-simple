package com.yourcompany.posapp.plugins;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.epson.epos2.Epos2Exception;
import com.epson.epos2.printer.Printer;

@CapacitorPlugin(name = "EpsonPrinter")
public class EpsonPrinterPlugin extends Plugin {
    
    private Printer printer;
    
    @PluginMethod
    public void connect(PluginCall call) {
        String target = call.getString("target", "USB:1208/514");
        
        try {
            printer = new Printer(Printer.TM_T88V, Printer.MODEL_ANK, getContext());
            printer.connect(target, Printer.PARAM_DEFAULT);
            call.resolve();
        } catch (Epos2Exception e) {
            call.reject("接続エラー: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void print(PluginCall call) {
        String text = call.getString("text", "");
        Integer copies = call.getInt("copies", 1);
        
        try {
            if (printer == null) {
                call.reject("プリンターが接続されていません");
                return;
            }
            
            printer.addText(text);
            printer.addFeedLine(3);
            printer.addCut(Printer.CUT_FEED);
            
            for (int i = 0; i < copies; i++) {
                printer.sendData(Printer.PARAM_DEFAULT);
            }
            
            call.resolve();
        } catch (Epos2Exception e) {
            call.reject("印刷エラー: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            if (printer != null) {
                printer.disconnect();
                printer = null;
            }
            call.resolve();
        } catch (Epos2Exception e) {
            call.reject("切断エラー: " + e.getMessage());
        }
    }
}