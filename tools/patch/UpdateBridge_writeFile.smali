# 追加到 smali/com/theunreleased/incredibox/UpdateBridge.smali
# 用途：JS 调用 window.AndroidUpdate.writeFile(相对路径, base64) 写入 filesDir
.method public writeFile(Ljava/lang/String;Ljava/lang/String;)Z
    .locals 6
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    :try_start_0
    const/4 v0, 0x0
    invoke-static {p2, v0}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B
    move-result-object v0

    iget-object v1, p0, Lcom/theunreleased/incredibox/UpdateBridge;->ctx:Landroid/content/Context;
    invoke-virtual {v1}, Landroid/content/Context;->getFilesDir()Ljava/io/File;
    move-result-object v1

    new-instance v2, Ljava/io/File;
    invoke-direct {v2, v1, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-virtual {v2}, Ljava/io/File;->getParentFile()Ljava/io/File;
    move-result-object v3
    if-eqz v3, :cond_dir_ok
    invoke-virtual {v3}, Ljava/io/File;->exists()Z
    move-result v4
    if-nez v4, :cond_dir_ok
    invoke-virtual {v3}, Ljava/io/File;->mkdirs()Z
    :cond_dir_ok

    new-instance v3, Ljava/io/FileOutputStream;
    invoke-direct {v3, v2}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    invoke-virtual {v3, v0}, Ljava/io/FileOutputStream;->write([B)V
    invoke-virtual {v3}, Ljava/io/FileOutputStream;->close()V

    const/4 v0, 0x1
    return v0
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    move-exception v0
    const/4 v0, 0x0
    return v0
.end method
