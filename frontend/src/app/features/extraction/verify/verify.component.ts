import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Verify Extracted Features</h2>
        <a routerLink="/extraction/upload" class="btn btn-secondary">Back to Uploads</a>
      </div>

      <div class="select-upload card" *ngIf="!selectedUploadId">
        <h3>Select an Upload to Verify</h3>
        <div class="upload-list">
          <div
            *ngFor="let upload of completedUploads"
            class="upload-item"
            (click)="selectUpload(upload.id)"
          >
            <span class="filename">{{ upload.originalFilename }}</span>
            <span class="company">{{ upload.company?.name || 'No company' }}</span>
            <span class="date">{{ upload.createdAt | date:'medium' }}</span>
          </div>
        </div>
        <p *ngIf="!completedUploads.length" class="no-data">No completed extractions to verify</p>
      </div>

      <div class="verify-section" *ngIf="extractionResults">
        <div class="info-bar card">
          <div>
            <strong>File:</strong> {{ extractionResults.originalFilename }}
          </div>
          <div>
            <strong>Extracted:</strong> {{ extractionResults.extractedAt | date:'medium' }}
          </div>
        </div>

        <div class="plan-info card">
          <h3>Plan Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Company *</label>
              <select [(ngModel)]="planData.companyId" required>
                <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Plan Name *</label>
              <input type="text" [(ngModel)]="planData.planName" required />
            </div>
          </div>
        </div>

        <div class="features-card card">
          <h3>Extracted Features</h3>
          <p>Review and edit the extracted values before saving.</p>

          <div class="features-table">
            <div class="feature-row header">
              <span class="col-category">Category</span>
              <span class="col-feature">Feature</span>
              <span class="col-extracted">Extracted Value</span>
              <span class="col-standardized">Standardized Value</span>
              <span class="col-verified">Verified Value</span>
            </div>

            <div *ngFor="let feature of extractionResults.features" class="feature-row">
              <span class="col-category">{{ feature.categoryName }}</span>
              <span class="col-feature">{{ feature.featureName }}</span>
              <span class="col-extracted">{{ feature.extractedValue }}</span>
              <span class="col-standardized">{{ feature.standardizedValue || 'N/A' }}</span>
              <span class="col-verified">
                <textarea
                  [(ngModel)]="featureValues[feature.featureId]"
                  rows="2"
                ></textarea>
              </span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-secondary" (click)="copyExtractedValues()">
            Copy All Extracted Values
          </button>
          <button class="btn btn-primary" (click)="saveAndVerify()" [disabled]="isSaving">
            {{ isSaving ? 'Saving...' : 'Save & Create Plan' }}
          </button>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading">Loading extraction results...</div>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card { background: #fff; border-radius: 8px; padding: 24px; margin-bottom: 20px; }

    .upload-list { display: flex; flex-direction: column; gap: 10px; }
    .upload-item {
      display: flex; justify-content: space-between; padding: 12px;
      border: 1px solid #ddd; border-radius: 6px; cursor: pointer;
      transition: all 0.2s;
    }
    .upload-item:hover { background: #f5f5f5; border-color: #4a9eff; }
    .filename { font-weight: 500; }
    .company, .date { color: #666; font-size: 0.9rem; }

    .info-bar { display: flex; gap: 30px; background: #f5f5f5; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }

    .features-table { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .feature-row { display: grid; grid-template-columns: 100px 150px 1fr 140px 1fr; gap: 10px; padding: 12px; border-bottom: 1px solid #eee; align-items: start; }
    .feature-row.header { background: #f5f5f5; font-weight: 600; }
    .feature-row:last-child { border-bottom: none; }
    .col-category { color: #666; font-size: 0.85rem; }
    .col-extracted { color: #333; font-size: 0.9rem; white-space: pre-wrap; max-height: 100px; overflow-y: auto; }
    .col-standardized { font-weight: 600; color: #2e7d32; text-align: center; background: #e8f5e9; padding: 8px; border-radius: 4px; }
    .col-verified textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; box-sizing: border-box; }

    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
    .btn { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }

    .no-data { color: #666; font-style: italic; text-align: center; padding: 20px; }
    .loading { text-align: center; padding: 40px; color: #666; }
  `],
})
export class VerifyComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  completedUploads: any[] = [];
  companies: any[] = [];
  selectedUploadId: number | null = null;
  extractionResults: any = null;
  featureValues: { [key: number]: string } = {};
  planData = { companyId: 0, planName: '' };

  isLoading = false;
  isSaving = false;

  ngOnInit(): void {
    this.loadCompanies();
    this.loadCompletedUploads();

    // Check for uploadId in query params
    this.route.queryParams.subscribe(params => {
      if (params['uploadId']) {
        this.selectUpload(+params['uploadId']);
      }
    });
  }

  loadCompanies(): void {
    this.apiService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
        if (companies.length) {
          this.planData.companyId = companies[0].id;
        }
      },
    });
  }

  loadCompletedUploads(): void {
    this.apiService.getUploads().subscribe({
      next: (uploads) => {
        this.completedUploads = uploads.filter(u => u.extractionStatus === 'completed');
      },
    });
  }

  selectUpload(uploadId: number): void {
    this.selectedUploadId = uploadId;
    this.isLoading = true;

    this.apiService.getExtractionResults(uploadId).subscribe({
      next: (results) => {
        this.extractionResults = results;
        this.isLoading = false;

        // Initialize feature values with extracted values
        this.featureValues = {};
        for (const feature of results.features) {
          this.featureValues[feature.featureId] = feature.extractedValue || '';
        }

        // Set company if available
        if (results.companyId) {
          this.planData.companyId = results.companyId;
        }
        this.planData.planName = results.originalFilename.replace('.pdf', '');
      },
      error: (err) => {
        this.isLoading = false;
        alert(err.error?.message || 'Failed to load extraction results');
      },
    });
  }

  copyExtractedValues(): void {
    for (const feature of this.extractionResults.features) {
      this.featureValues[feature.featureId] = feature.extractedValue || '';
    }
  }

  saveAndVerify(): void {
    if (!this.planData.companyId || !this.planData.planName) {
      alert('Please fill in company and plan name');
      return;
    }

    this.isSaving = true;

    const verifyData = {
      companyId: this.planData.companyId,
      planName: this.planData.planName,
      featureValues: this.extractionResults.features.map((f: any) => ({
        featureId: f.featureId,
        extractedValue: f.extractedValue,
        verifiedValue: this.featureValues[f.featureId] || f.extractedValue,
        isVerified: true,
      })),
    };

    this.apiService.verifyExtraction(this.selectedUploadId!, verifyData).subscribe({
      next: (plan) => {
        this.isSaving = false;
        alert(`Plan "${plan.name}" created successfully!`);
        this.router.navigate(['/plans']);
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Failed to save plan');
      },
    });
  }
}
