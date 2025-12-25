import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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

      <!-- 🔄 EXTRACTION LOADER -->
      <div class="loader-overlay" *ngIf="isExtracting">
        <div class="loader-box">
          <div class="spinner"></div>
          <p class="loader-title">{{ progressLabel }}</p>

          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress"></div>
            </div>
            <p class="progress-text">{{ progress }}%</p>
          </div>
        </div>
      </div>

      <!-- ✅ SUCCESS MODAL (REFINED) -->
      <div class="modal-overlay" *ngIf="showSuccessModal">
        <div class="success-modal">
          <div class="success-icon">
            ✓
          </div>

          <h3 class="success-title">Extraction completed</h3>

          <p class="success-subtitle">
            All features were successfully extracted for
            <strong>{{ completedPlanName }}</strong>.
          </p>

          <button class="btn btn-primary success-cta" (click)="goToVerify()">
            Review & Verify
          </button>

          <button class="success-secondary" (click)="showSuccessModal = false">
            Close
          </button>
        </div>
      </div>

      <!-- ================= UPLOAD SECTION ================= -->
      <div class="upload-section card">
        <h3>Upload PDF Brochure</h3>
        <p>Upload a health insurance brochure PDF to extract features using AI.</p>

        <div class="form-row">
          <div class="form-group">
            <label>Company *</label>
            <select [(ngModel)]="selectedCompanyId" (change)="onCompanyChange()">
              <option [ngValue]="null">-- Select Company --</option>
              <option *ngFor="let company of companies" [ngValue]="company.id">
                {{ company.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Plan *</label>
            <select
              [(ngModel)]="selectedPlanId"
              [disabled]="!selectedCompanyId || !plans.length"
            >
              <option [ngValue]="null">-- Select Plan --</option>
              <option *ngFor="let plan of plans" [ngValue]="plan.id">
                {{ plan.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- DROPZONE -->
        <div
          class="enhanced-dropzone"
          [class.disabled]="!isUploadEnabled"
          (click)="isUploadEnabled && fileInput.click()"
        >
          <input
            #fileInput
            type="file"
            hidden
            accept="application/pdf"
            (change)="onFileSelect($event)"
          />

          <div class="dropzone-content">
            <div class="pdf-icon">📄</div>

            <p class="title" *ngIf="isUploadEnabled">
              Drag & Drop your PDF brochure
            </p>

            <p class="title" *ngIf="!isUploadEnabled">
              Select Company & Plan first
            </p>

            <p class="subtitle">
              or <span class="browse">click to browse</span>
            </p>

            <p class="hint">Only PDF files are supported</p>

            <p *ngIf="selectedFile" class="file-selected">
              ✔ {{ selectedFile.name }}
            </p>
          </div>
        </div>

        <button
          class="btn btn-primary upload-btn"
          (click)="uploadAndExtract()"
          [disabled]="!selectedFile || !isUploadEnabled || isExtracting"
        >
          {{ isExtracting ? 'Processing…' : 'Upload & Extract' }}
        </button>
      </div>

      <!-- ================= RECENT UPLOADS ================= -->
      <div class="card">
        <h3>Recent Uploads</h3>

        <div class="upload-list uploads-grid">
          <div class="upload-item header">
            <span>File</span>
            <span>Company</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          <div
            *ngFor="let upload of recentUploads"
            class="upload-item"
            (click)="openUpload(upload)"
          >
            <span>{{ upload.originalFilename }}</span>
            <span>{{ upload.company?.name || '-' }}</span>
            <span>{{ upload.plan?.name || '-' }}</span>
            <span>{{ upload.extractionStatus }}</span>
            <span>{{ upload.createdAt | date: 'short' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== EXISTING CSS (UNCHANGED) ===== */
    .page-container { padding: 20px; }
    .card { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 20px; }
    .form-row { display: grid; grid-template-columns: 2fr 5fr; gap: 20px; margin-bottom: 20px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group select { width: 100%; max-width: 280px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }

    .btn-primary {
      background: #4a9eff;
      color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
    }
    .btn-primary:disabled {
      background: #bcdcff;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .upload-btn { margin-top: 24px; }

    .enhanced-dropzone {
      border: 2px dashed #cfd8dc;
      border-radius: 14px;
      padding: 60px 40px;
      background: linear-gradient(135deg, #f9fbff, #f4f8ff);
      cursor: pointer;
    }
    .enhanced-dropzone.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .dropzone-content { text-align: center; }
    .pdf-icon { font-size: 3.5rem; margin-bottom: 10px; }
    .browse { color: #4a9eff; font-weight: 600; }
    .file-selected { margin-top: 12px; color: #2e7d32; font-weight: 500; }

    .upload-list { display: flex; flex-direction: column; gap: 10px; }
    .uploads-grid .upload-item {
      display: grid;
      grid-template-columns: 3fr 2fr 2fr 1.5fr 1.5fr;
      gap: 12px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
    }

    .loader-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.85);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loader-box {
      background: #fff;
      padding: 30px 40px;
      border-radius: 12px;
      text-align: center;
      min-width: 320px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 5px solid #ddd;
      border-top-color: #4a9eff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(2px);
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ===== NEW SUCCESS MODAL STYLES (SAFE ADDITION) ===== */
    .success-modal {
      background: #fff;
      padding: 36px 40px;
      border-radius: 14px;
      width: 100%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15);
    }

    .success-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: #e6f3ff;
      color: #4a9eff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
    }

    .success-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .success-subtitle {
      font-size: 14px;
      color: #555;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .success-cta {
      width: 100%;
      margin-bottom: 12px;
    }

    .success-secondary {
      background: none;
      border: none;
      color: #666;
      font-size: 13px;
      cursor: pointer;
    }
  `],
})
export class UploadComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private router = inject(Router);

  companies: any[] = [];
  plans: any[] = [];
  recentUploads: any[] = [];

  selectedCompanyId: number | null = null;
  selectedPlanId: number | null = null;
  selectedFile: File | null = null;

  isExtracting = false;
  progress = 0;
  progressLabel = '';

  showSuccessModal = false;
  completedUploadId: number | null = null;
  completedPlanName = '';

  private pollingTimer: any;

  get isUploadEnabled(): boolean {
    return !!this.selectedCompanyId && !!this.selectedPlanId;
  }

  ngOnInit() {
    this.loadCompanies();
    this.loadRecentUploads();
  }

  ngOnDestroy() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  loadCompanies() {
    this.apiService.getCompanies().subscribe(d => this.companies = d);
  }

  loadRecentUploads() {
    this.apiService.getUploads().subscribe(d => this.recentUploads = d.slice(0, 10));
  }

  onCompanyChange() {
    this.selectedPlanId = null;
    this.apiService.getPlans(this.selectedCompanyId!).subscribe(p => this.plans = p);
  }

  uploadAndExtract() {
    this.isExtracting = true;
    this.progress = 0;
    this.progressLabel = 'Uploading brochure…';

    this.apiService.uploadBrochure(
      this.selectedFile!,
      this.selectedCompanyId!,
      this.selectedPlanId!
    ).subscribe(upload => {
      this.apiService.processExtraction(upload.id).subscribe(() => {
        this.startPolling(upload.id);
      });
    });
  }

  startPolling(uploadId: number) {
    this.pollingTimer = setInterval(() => {
      this.apiService.getExtractionStatus(uploadId).subscribe(res => {
        this.progress = res.progress ?? 0;

        if (this.progress < 30) this.progressLabel = 'Preparing…';
        else if (this.progress < 70) this.progressLabel = 'Extracting features…';
        else this.progressLabel = 'Finalizing…';

        if (res.status === 'completed') {
          clearInterval(this.pollingTimer);
          this.isExtracting = false;
          this.completedUploadId = uploadId;
          this.completedPlanName =
            this.plans.find(p => p.id === this.selectedPlanId)?.name || '';
          this.showSuccessModal = true;
          this.loadRecentUploads();
        }

        if (res.status === 'failed') {
          clearInterval(this.pollingTimer);
          this.isExtracting = false;
          alert('Extraction failed');
        }
      });
    }, 2000);
  }

  goToVerify() {
    this.router.navigate(['/extraction/verify'], {
      queryParams: { uploadId: this.completedUploadId },
    });
  }

  openUpload(upload: any) {
    if (upload.extractionStatus === 'completed') {
      this.router.navigate(['/extraction/verify'], {
        queryParams: { uploadId: upload.id },
      });
    }
  }

  onFileSelect(e: any) {
    this.selectedFile = e.target.files?.[0] || null;
  }
}
