/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.kie.kogito.service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.Startup;
import org.jboss.logging.Logger;
import org.kie.kogito.form.FormSchemaService;
import org.kie.kogito.model.Data;
import org.kie.kogito.model.UploadStatus;

@Startup
@ApplicationScoped
public class UploadServiceImpl implements UploadService {

    private static final Logger LOGGER = Logger.getLogger(UploadServiceImpl.class);

    private static final String TMP_FOLDER = "/tmp";
    private static final String META_INF_RESOURCES_FOLDER = "src/main/resources/META-INF/resources";
    private static final String STATUS_FILE = "status.txt";
    private static final String UPLOAD_FILE = "file.zip";
    private static final String DATA_JSON_FILE = "data.json";
    private static final String BASE_URL = System.getenv("BASE_URL");
    private static final int UPLOAD_TIMEOUT_MS = 1000 * 60 * 10; // 10 minutes

    private Timer timeoutTimer;
    private File statusFile;

    @Inject
    ZipService zipService;

    @Inject
    FormSchemaService formSchemaService;

    @PostConstruct
    public void postConstruct() {
        LOGGER.info("PostConstruct");
        statusFile = Paths.get(TMP_FOLDER, STATUS_FILE).toFile();

        if (!statusFile.exists()) {
            updateStatus(UploadStatus.WAITING);
        }

        if (getStatus() == UploadStatus.WAITING) {
            timeoutTimer = startTimer();
        }
    }

    @PreDestroy
    public void preDestroy() {
        LOGGER.info("PreDestroy");
        cancelTimer();
    }

    @Override
    public UploadStatus getStatus() {
        if (!statusFile.exists()) {
            return UploadStatus.ERROR;
        }

        try (var reader = new BufferedReader(new FileReader(statusFile.getAbsolutePath()))) {
            var status = reader.readLine();
            return UploadStatus.valueOf(status);
        } catch (IOException e) {
            LOGGER.error("Error reading status file", e);
            return UploadStatus.ERROR;
        }
    }

    @Override
    public void upload(final InputStream inputStream) {
        LOGGER.info("Uploading file");
        cancelTimer();

        var zipPath = Paths.get(META_INF_RESOURCES_FOLDER, UPLOAD_FILE);
        try {
            Files.copy(inputStream, zipPath, StandardCopyOption.REPLACE_EXISTING);
            var filePaths = zipService.unzip(zipPath.toString(), META_INF_RESOURCES_FOLDER);
            writeData(filePaths);
            updateStatus(UploadStatus.UPLOADED);
        } catch (Exception e) {
            LOGGER.error("Error when uploading file", e);
            updateStatus(UploadStatus.ERROR);
        }
    }

    private void writeData(final List<String> filePaths) throws IOException {
        var forms = formSchemaService.generate(META_INF_RESOURCES_FOLDER, filePaths);
        var data = new Data(BASE_URL, forms);

        var mapper = new ObjectMapper();
        try (var writer = new BufferedWriter(new FileWriter(Paths.get(META_INF_RESOURCES_FOLDER, DATA_JSON_FILE).toString()))) {
            writer.write(mapper.writeValueAsString(data));
        }
    }

    private void updateStatus(final UploadStatus status) {
        try (var writer = new BufferedWriter(new FileWriter(statusFile.getAbsolutePath()))) {
            writer.write(status.name());
            LOGGER.info("UploadStatus updated to " + status);
        } catch (IOException e) {
            LOGGER.error("Error updating status file", e);
        }
    }

    private Timer startTimer() {
        LOGGER.info("Starting timer");
        var timer = new Timer();
        timer.schedule(
                new TimerTask() {
                    @Override
                    public void run() {
                        LOGGER.warn("Upload timed out");
                        updateStatus(UploadStatus.ERROR);
                    }
                },
                UPLOAD_TIMEOUT_MS
        );
        return timer;
    }

    private void cancelTimer() {
        LOGGER.info("Cancelling timer");
        if (timeoutTimer == null) {
            LOGGER.info("No timer to be cancelled");
            return;
        }
        timeoutTimer.cancel();
        LOGGER.info("Timer cancelled");
    }
}
