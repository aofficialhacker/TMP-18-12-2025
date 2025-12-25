import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Verify Extracted Features</h2>
        <a routerLink="/extraction/upload" class="btn btn-secondary">
          Back to Uploads
        </a>
      </div>

      <!-- ================= SUMMARY ================= -->
      <div class="card summary-card" *ngIf="extractionResults">
        <div class="summary-grid">
          <div class="summary-item">
            <label>Plan Name</label>
            <span>{{ extractionResults.plan?.name || '-' }}</span>
          </div>

          <div class="summary-item">
            <label>Company Name</label>
            <span>{{ extractionResults.company?.name || '-' }}</span>
          </div>

          <div class="summary-item">
            <label>Upload Date</label>
            <span>{{ extractionResults.extractedAt | date:'medium' }}</span>
          </div>
        </div>
      </div>

      <!-- ================= SELECT UPLOAD ================= -->
      <div class="card select-upload" *ngIf="!extractionResults && !isLoading">
        <h3>Select an Upload to Verify</h3>

        <div class="upload-list">
          <div
            class="upload-item"
            style="font-weight:600; background:#f5f5f5; cursor:default;"
          >
            <span>Plan</span>
            <span>Company</span>
            <span>Date</span>
          </div>

          <div
            *ngFor="let upload of completedUploads"
            class="upload-item"
            (click)="selectUpload(upload.id)"
          >
            <span>{{ upload.plan?.name || '-' }}</span>
            <span>{{ upload.company?.name || '-' }}</span>
            <span>{{ upload.createdAt | date:'medium' }}</span>
          </div>
        </div>

        <p *ngIf="!completedUploads.length" class="no-data">
          No completed extractions to verify
        </p>
      </div>

      <!-- ================= VERIFY SECTION ================= -->
      <div class="verify-section" *ngIf="extractionResults">
        <div class="card info-bar">
          <span><strong>File:</strong> {{ extractionResults.originalFilename }}</span>
          <span>
            <strong>Extracted:</strong>
            {{ extractionResults.extractedAt | date:'medium' }}
          </span>
        </div>

        <div class="card plan-info">
          <h3>Plan Information</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Company</label>
              <input type="text" [value]="extractionResults.company?.name || ''" readonly />
            </div>

            <div class="form-group">
              <label>Plan Name</label>
              <input type="text" [value]="extractionResults.plan?.name || ''" readonly />
            </div>
          </div>
        </div>

        <div class="card features-card">
          <h3>Extracted Features</h3>
          <p>Review and edit the extracted values before saving.</p>

          <div class="features-table">
            <div class="feature-row header">
              <span style="text-align:center; font-weight:700;">Category</span>
              <span style="text-align:center; font-weight:700;">Feature</span>
              <span style="text-align:center; font-weight:700;">Extracted</span>
              <span style="text-align:center; font-weight:700;">Standardized</span>
              <span style="text-align:center; font-weight:700;">Verified</span>
            </div>

            <div class="feature-row" *ngFor="let feature of extractionResults.features">
              <span style="text-align:center; font-weight:600;">{{ feature.categoryName || '-' }}</span>
              <span style="text-align:center; font-weight:600;">{{ feature.featureName }}</span>
              <span style="text-align:center; font-weight:600;">{{ feature.extractedValue }}</span>
              <span style="text-align:center; font-weight:600;">{{ feature.standardizedValue || 'N/A' }}</span>
              <span>
                <textarea rows="2" [(ngModel)]="featureValues[feature.featureId]"></textarea>
              </span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" (click)="saveAndVerify()" [disabled]="isSaving">
            {{ isSaving ? 'Saving...' : 'Save & Verify' }}
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading">
        Loading extraction results...
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card {
      background: #fff;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .summary-card { background: #f9fafc; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .summary-item label {
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
    }

    .summary-item span {
      font-size: 1rem;
      font-weight: 600;
    }

    .upload-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .upload-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
    }

    .upload-item:hover {
      background: #f5f5f5;
      border-color: #4a9eff;
    }

    .info-bar {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #ddd;
    }

    .features-table {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }

    .feature-row {
      display: grid;
      grid-template-columns: 120px 160px 1fr 160px 1fr;
      gap: 10px;
      padding: 12px;
      border-bottom: 1px solid #eee;
      align-items: center;
    }

    .feature-row.header {
      background: #f5f5f5;
      font-weight: 600;
    }

    textarea {
      width: 100%;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
      resize: vertical;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-primary {
      background: #4a9eff;
      color: #fff;
      border-radius: 6px;
      padding: 10px 20px;
      border: none;
      cursor: pointer;
    }

    /* ✅ ENHANCED BACK TO UPLOADS BUTTON */
    .btn-secondary {
      background: #4a9eff;
      color: #fff;
      border-radius: 6px;
      padding: 10px 20px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn-secondary:hover {
      box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.35);
      transform: translateY(-1px);
    }

    .loading {
      text-align: center;
      color: #666;
      font-style: italic;
    }

    @media (max-width: 900px) {
      .summary-grid,
      .form-row,
      .feature-row {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class VerifyComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  completedUploads: any[] = [];
  extractionResults: any = null;
  featureValues: { [key: number]: string } = {};

  isLoading = false;
  isSaving = false;

  ngOnInit(): void {
    this.loadCompletedUploads();

    this.route.queryParams.subscribe(params => {
      if (params['uploadId']) {
        this.selectUpload(+params['uploadId']);
      }
    });
  }

  loadCompletedUploads(): void {
    this.apiService.getUploads().subscribe(uploads => {
      this.completedUploads = uploads.filter(
        u => u.extractionStatus === 'completed'
      );
    });
  }

  selectUpload(uploadId: number): void {
    this.isLoading = true;

    this.apiService.getExtractionResults(uploadId).subscribe({
      next: results => {
        this.extractionResults = results;
        this.featureValues = {};
        for (const f of results.features) {
          this.featureValues[f.featureId] = f.extractedValue || '';
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to load extraction results');
      }
    });
  }

  saveAndVerify(): void {
    this.isSaving = true;

    const payload = {
      featureValues: this.extractionResults.features.map((f: any) => ({
        featureId: f.featureId,
        extractedValue: f.extractedValue,
        verifiedValue: this.featureValues[f.featureId] || f.extractedValue,
        isVerified: true,
      })),
    };

    this.apiService.verifyExtraction(this.extractionResults.uploadId, payload)
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/plans']);
        },
        error: () => {
          this.isSaving = false;
          alert('Failed to save verification');
        },
      });
  }
}
