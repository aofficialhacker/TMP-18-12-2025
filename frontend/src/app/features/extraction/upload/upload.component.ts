import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>Upload Brochure</h2>

      <div class="upload-section card">
        <h3>Upload PDF Brochure</h3>
        <p>Upload a health insurance brochure PDF to extract features using AI.</p>

        <div class="form-group">
          <label>Company (Optional)</label>
          <select [(ngModel)]="selectedCompanyId">
            <option [value]="null">-- Select Company --</option>
            <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
          </select>
        </div>

        <div
          class="dropzone"
          [class.dragover]="isDragOver"
          (dragover)="onDragOver($event)"
          (dragleave)="isDragOver = false"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <input
            type="file"
            #fileInput
            (change)="onFileSelect($event)"
            accept="application/pdf"
            hidden
          />
          <div class="dropzone-content">
            <span class="icon">📄</span>
            <p *ngIf="!selectedFile">Drag & drop PDF here or click to browse</p>
            <p *ngIf="selectedFile" class="file-selected">
              <strong>{{ selectedFile.name }}</strong>
              <span>({{ formatFileSize(selectedFile.size) }})</span>
            </p>
          </div>
        </div>

        <button
          class="btn btn-primary"
          (click)="uploadFile()"
          [disabled]="!selectedFile || isUploading"
        >
          {{ isUploading ? 'Uploading...' : 'Upload & Extract' }}
        </button>
      </div>

      <div class="uploads-section card">
        <h3>Recent Uploads</h3>
        <table class="data-table" *ngIf="uploads.length">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Company</th>
              <th>Status</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let upload of uploads">
              <td>{{ upload.originalFilename }}</td>
              <td>{{ upload.company?.name || '-' }}</td>
              <td>
                <span class="badge" [ngClass]="upload.extractionStatus">
                  {{ upload.extractionStatus }}
                </span>
              </td>
              <td>{{ upload.createdAt | date:'medium' }}</td>
              <td>
                <button
                  *ngIf="upload.extractionStatus === 'pending'"
                  class="btn btn-sm"
                  (click)="processExtraction(upload)"
                >
                  Extract
                </button>
                <button
                  *ngIf="upload.extractionStatus === 'completed'"
                  class="btn btn-sm btn-success"
                  (click)="goToVerify(upload)"
                >
                  Verify
                </button>
                <button
                  *ngIf="upload.extractionStatus === 'processing'"
                  class="btn btn-sm"
                  disabled
                >
                  Processing...
                </button>
                <button class="btn-icon" (click)="deleteUpload(upload)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!uploads.length" class="no-data">No uploads yet</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }
    .card { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 20px; }
    .card h3 { margin: 0 0 8px; }
    .card p { color: #666; margin-bottom: 20px; }

    .form-group { margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group select { width: 100%; max-width: 300px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }

    .dropzone {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 20px;
    }
    .dropzone:hover, .dropzone.dragover { border-color: #4a9eff; background: #f8fbff; }
    .dropzone-content .icon { font-size: 3rem; }
    .file-selected { color: #2e7d32; }

    .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
    .btn-success { background: #4caf50; color: #fff; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }

    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }

    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; text-transform: capitalize; }
    .badge.pending { background: #fff3e0; color: #e65100; }
    .badge.processing { background: #e3f2fd; color: #1565c0; }
    .badge.completed { background: #e8f5e9; color: #2e7d32; }
    .badge.failed { background: #ffebee; color: #c62828; }

    .no-data { color: #666; font-style: italic; text-align: center; padding: 20px; }
  `],
})
export class UploadComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  companies: any[] = [];
  uploads: any[] = [];
  selectedCompanyId: number | null = null;
  selectedFile: File | null = null;
  isDragOver = false;
  isUploading = false;

  ngOnInit(): void {
    this.loadCompanies();
    this.loadUploads();
  }

  loadCompanies(): void {
    this.apiService.getCompanies().subscribe({
      next: (companies) => this.companies = companies,
    });
  }

  loadUploads(): void {
    this.apiService.getUploads().subscribe({
      next: (uploads) => this.uploads = uploads,
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.handleFile(files[0]);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }
    this.selectedFile = file;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.apiService.uploadBrochure(this.selectedFile, this.selectedCompanyId || undefined).subscribe({
      next: (upload) => {
        this.isUploading = false;
        this.selectedFile = null;
        this.loadUploads();
        // Automatically start extraction
        this.processExtraction(upload);
      },
      error: (err) => {
        this.isUploading = false;
        alert(err.error?.message || 'Upload failed');
      },
    });
  }

  processExtraction(upload: any): void {
    this.apiService.processExtraction(upload.id).subscribe({
      next: () => {
        this.loadUploads();
        alert('Extraction completed! Click "Verify" to review the results.');
      },
      error: (err) => {
        this.loadUploads();
        alert(err.error?.message || 'Extraction failed');
      },
    });
  }

  goToVerify(upload: any): void {
    this.router.navigate(['/extraction/verify'], { queryParams: { uploadId: upload.id } });
  }

  deleteUpload(upload: any): void {
    if (!confirm('Delete this upload?')) return;
    this.apiService.deleteUpload(upload.id).subscribe({
      next: () => this.loadUploads(),
    });
  }
}
