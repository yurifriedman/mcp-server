/**
 * Google Drive client for downloading files
 */

import { google } from 'googleapis';
import { getAuthenticatedClient } from './auth.js';
import * as fs from 'fs';

export class DriveClient {
  private drive: any;

  private constructor(drive: any) {
    this.drive = drive;
  }

  /**
   * Create and authenticate Drive client
   */
  static async create(): Promise<DriveClient> {
    const auth = await getAuthenticatedClient();
    const drive = google.drive({ version: 'v3', auth });
    return new DriveClient(drive);
  }

  /**
   * Search for files by name
   */
  async searchFilesByName(fileName: string): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        q: `name='${fileName}' and trashed=false`,
        fields: 'files(id, name, mimeType, modifiedTime, size)',
        orderBy: 'modifiedTime desc',
        pageSize: 10
      });

      return response.data.files || [];
    } catch (error: any) {
      throw new Error(`Failed to search files: ${error.message}`);
    }
  }

  /**
   * Download file by file ID to a local path
   */
  async downloadFile(fileId: string, destPath: string): Promise<void> {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const dest = fs.createWriteStream(destPath);

      await new Promise((resolve, reject) => {
        response.data
          .on('end', () => {
            resolve(true);
          })
          .on('error', (err: any) => {
            reject(err);
          })
          .pipe(dest);
      });
    } catch (error: any) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Download file by name (searches for the file first)
   */
  async downloadFileByName(fileName: string, destPath: string): Promise<void> {
    const files = await this.searchFilesByName(fileName);

    if (files.length === 0) {
      throw new Error(`File not found: ${fileName}`);
    }

    const file = files[0];
    console.log(`Found file: ${file.name} (ID: ${file.id}, Modified: ${file.modifiedTime})`);

    await this.downloadFile(file.id, destPath);
    console.log(`Downloaded to: ${destPath}`);
  }
}
