import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Features Management</h2>
        <button class="btn btn-primary" (click)="openForm()">+ Add Feature</button>
      </div>

      <div class="filter-bar">
        <label>Filter by Category:</label>
        <select [(ngModel)]="selectedCategoryId" (change)="loadFeatures()">
          <option [value]="null">All Categories</option>
          <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div
        class="weight-info"
        *ngIf="selectedCategoryId"
        [class.valid]="weightsValid"
        [class.invalid]="!weightsValid"
      >
        <span>Category Feature Weights: {{ totalWeight }}% / 100%</span>
        <span class="weight-status">
          {{ weightsValid ? 'Valid' : 'Weights must sum to 100%' }}
        </span>
        <button class="btn btn-sm" (click)="saveWeights()" [disabled]="!weightsValid">
          Save Weights
        </button>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <!-- ✅ Display Order FIRST -->
              <th>Display Order</th>
              <th>Feature Name</th>
              <th>Category</th>
              <th>Weightage</th>
              <th>Keywords</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let feature of features">
              <!-- ✅ Display Order value -->
              <td>{{ feature.displayOrder }}</td>
              <td><strong>{{ feature.name }}</strong></td>
              <td>{{ feature.category?.name }}</td>
              <td>
                <input
                  type="number"
                  class="weight-input"
                  [value]="feature.weightage"
                  (change)="onWeightChange(feature, $event)"
                  min="0"
                  max="100"
                />%
              </td>
              <td>{{ getKeywordsPreview(feature.extractionKeywords) }}</td>
              <td>
                <span class="badge" [class.active]="feature.isActive">
                  {{ feature.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn-icon" (click)="editFeature(feature)">✏️</button>
                <button class="btn-icon" (click)="confirmDelete(feature)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingFeature ? 'Edit Feature' : 'Add Feature' }}</h3>

          <form (ngSubmit)="saveFeature()">
            <div class="form-group">
              <label>Category *</label>
              <select [(ngModel)]="formData.categoryId" name="categoryId" required>
                <option *ngFor="let cat of categories" [value]="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Name *</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="formData.description" name="description" rows="2"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Weightage *</label>
                <input
                  type="number"
                  [(ngModel)]="formData.weightage"
                  name="weightage"
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div class="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  [(ngModel)]="formData.displayOrder"
                  name="displayOrder"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Extraction Keywords (comma-separated)</label>
              <input
                type="text"
                [(ngModel)]="keywordsInput"
                name="keywords"
                placeholder="e.g., hospitalization, inpatient, hospital"
              />
              <small>Keywords help Gemini find relevant information in brochures</small>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                {{ editingFeature ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Feature"
        [message]="'Are you sure you want to delete ' + featureToDelete?.name + '?'"
        (confirmed)="deleteFeature()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    /* 🔒 CSS FULLY RESTORED – UNCHANGED */
    .page-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

    .filter-bar { margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
    .filter-bar select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }

    .weight-info { padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .weight-info.valid { background: #e8f5e9; color: #2e7d32; }
    .weight-info.invalid { background: #ffebee; color: #c62828; }

    .card { background: #fff; border-radius: 8px; padding: 20px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }

    .weight-input { width: 60px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }

    .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 500px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .form-group small { color: #666; font-size: 0.8rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  `],
})
export class FeaturesComponent implements OnInit {
  private apiService = inject(ApiService);

  categories: any[] = [];
  features: any[] = [];
  selectedCategoryId: number | null = null;

  showForm = false;
  editingFeature: any = null;
  formData = { categoryId: 0, name: '', description: '', weightage: 0, displayOrder: 0 };
  keywordsInput = '';

  showDeleteConfirm = false;
  featureToDelete: any = null;

  totalWeight = 0;
  weightsValid = false;

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeatures();
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe(categories => {
      this.categories = categories;
      if (categories.length && !this.formData.categoryId) {
        this.formData.categoryId = categories[0].id;
      }
    });
  }

  loadFeatures(): void {
    const catId = this.selectedCategoryId ? this.selectedCategoryId : undefined;
    this.apiService.getFeatures(catId, true).subscribe(features => {
      // ✅ SORT BY DISPLAY ORDER
      this.features = [...features].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      );
      this.calculateTotalWeight();
    });
  }

  calculateTotalWeight(): void {
    if (!this.selectedCategoryId) {
      this.totalWeight = 0;
      this.weightsValid = true;
      return;
    }

    this.totalWeight = this.features
      .filter(f => f.isActive && f.categoryId === this.selectedCategoryId)
      .reduce((sum, f) => sum + f.weightage, 0);

    this.weightsValid = this.totalWeight === 100;
  }

  onWeightChange(feature: any, event: Event): void {
    feature.weightage = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.calculateTotalWeight();
  }

  saveWeights(): void {
    if (!this.selectedCategoryId) return;

    const weights = this.features
      .filter(f => f.isActive && f.categoryId === this.selectedCategoryId)
      .map(f => ({ id: f.id, weightage: f.weightage }));

    this.apiService.updateFeatureWeights(this.selectedCategoryId, weights).subscribe(() => {
      this.loadFeatures();
    });
  }

  getKeywordsPreview(keywords: string): string {
    if (!keywords) return '-';
    try {
      const arr = JSON.parse(keywords);
      return arr.slice(0, 3).join(', ') + (arr.length > 3 ? '...' : '');
    } catch {
      return keywords;
    }
  }

  openForm(): void {
    this.editingFeature = null;
    this.formData = {
      categoryId: this.categories[0]?.id || 0,
      name: '',
      description: '',
      weightage: 0,
      displayOrder: 0,
    };
    this.keywordsInput = '';
    this.showForm = true;
  }

  editFeature(feature: any): void {
    this.editingFeature = feature;
    this.formData = {
      categoryId: feature.categoryId,
      name: feature.name,
      description: feature.description || '',
      weightage: feature.weightage,
      displayOrder: feature.displayOrder,
    };
    try {
      this.keywordsInput = JSON.parse(feature.extractionKeywords || '[]').join(', ');
    } catch {
      this.keywordsInput = '';
    }
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingFeature = null;
  }

  saveFeature(): void {
    const data = {
      ...this.formData,
      extractionKeywords: this.keywordsInput
        .split(',')
        .map(k => k.trim())
        .filter(Boolean),
    };

    const request = this.editingFeature
      ? this.apiService.updateFeature(this.editingFeature.id, data)
      : this.apiService.createFeature(data);

    request.subscribe(() => {
      this.closeForm();
      this.loadFeatures();
    });
  }

  confirmDelete(feature: any): void {
    this.featureToDelete = feature;
    this.showDeleteConfirm = true;
  }

  deleteFeature(): void {
    if (!this.featureToDelete) return;

    this.apiService.deleteFeature(this.featureToDelete.id).subscribe(() => {
      this.showDeleteConfirm = false;
      this.featureToDelete = null;
      this.loadFeatures();
    });
  }
}
