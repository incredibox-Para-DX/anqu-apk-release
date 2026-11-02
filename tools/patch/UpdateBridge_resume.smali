.method public fileSize(Ljava/lang/String;)J
    .locals 4
    :try_start_0
    iget-object v0, p0, Lcom/theunreleased/incredibox/UpdateBridge;->ctx:Landroid/content/Context;
    invoke-virtual {v0}, Landroid/content/Context;->getFilesDir()Ljava/io/File;
    move-result-object v0
    new-instance v1, Ljava/io/File;
    invoke-direct {v1, v0, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V
    invoke-virtual {v1}, Ljava/io/File;->exists()Z
    move-result v2
    if-eqz v2, :cond_zero
    invoke-virtual {v1}, Ljava/io/File;->length()J
    move-result-wide v2
    return-wide v2
    :cond_zero
    const-wide/16 v2, 0x0
    return-wide v2
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    :catch_0
    move-exception v0
    const-wide/16 v2, 0x0
    return-wide v2
.end method

.method public writeFileAt(Ljava/lang/String;Ljava/lang/String;J)Z
    .locals 6
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

    new-instance v3, Ljava/io/RandomAccessFile;
    const-string v4, "rw"
    invoke-direct {v3, v2, v4}, Ljava/io/RandomAccessFile;-><init>(Ljava/io/File;Ljava/lang/String;)V
    invoke-virtual {v3, p3, p4}, Ljava/io/RandomAccessFile;->seek(J)V
    invoke-virtual {v3, v0}, Ljava/io/RandomAccessFile;->write([B)V
    invoke-virtual {v3}, Ljava/io/RandomAccessFile;->close()V

    const/4 v0, 0x1
    return v0
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    :catch_0
    move-exception v0
    const/4 v0, 0x0
    return v0
.end method
