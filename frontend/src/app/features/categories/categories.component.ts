import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Categories Management</h2>
        <button class="btn btn-primary" (click)="openForm()">+ Add Category</button>
      </div>

      <div class="weight-info" [class.valid]="weightsValid" [class.invalid]="!weightsValid">
        <span>Total Weight: {{ totalWeight }}% / 100%</span>
        <span class="weight-status">{{ weightsValid ? 'Valid' : 'Weights must sum to 100%' }}</span>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Weightage</th>
              <th>Features</th>
              <th>Order</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let category of categories">
              <td><strong>{{ category.name }}</strong></td>
              <td>{{ category.description || '-' }}</td>
              <td>
                <input
                  type="number"
                  class="weight-input"
                  [value]="category.weightage"
                  (change)="onWeightChange(category, $event)"
                  min="0"
                  max="100"
                />%
              </td>
              <td>{{ category.features?.length || 0 }}</td>
              <td>{{ category.displayOrder }}</td>
              <td>
                <span class="badge" [class.active]="category.isActive" [class.inactive]="!category.isActive">
                  {{ category.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn-icon" (click)="editCategory(category)" title="Edit">✏️</button>
                <button class="btn-icon" (click)="confirmDelete(category)" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button class="btn btn-secondary" (click)="saveWeights()" [disabled]="!weightsValid">
        Save Weights
      </button>

      <!-- Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</h3>
          <form (ngSubmit)="saveCategory()">
            <div class="form-group">
              <label>Name *</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="formData.description" name="description" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Weightage *</label>
                <input type="number" [(ngModel)]="formData.weightage" name="weightage" min="0" max="100" required />
              </div>
              <div class="form-group">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="formData.displayOrder" name="displayOrder" />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ editingCategory ? 'Update' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Category"
        [message]="'Are you sure you want to delete ' + categoryToDelete?.name + '?'"
        (confirmed)="deleteCategory()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { margin: 0; }

    .weight-info {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
    }
    .weight-info.valid { background: #e8f5e9; color: #2e7d32; }
    .weight-info.invalid { background: #ffebee; color: #c62828; }

    .card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .data-table th { font-weight: 600; color: #666; }

    .weight-input { width: 60px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; }

    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #ffebee; color: #c62828; }

    .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 500px; }
    .modal h3 { margin: 0 0 20px; }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  `],
})
export class CategoriesComponent implements OnInit {
  private apiService = inject(ApiService);

  categories: any[] = [];
  showForm = false;
  editingCategory: any = null;
  formData = { name: '', description: '', weightage: 0, displayOrder: 0 };

  showDeleteConfirm = false;
  categoryToDelete: any = null;

  totalWeight = 0;
  weightsValid = false;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.apiService.getCategories(true).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.calculateTotalWeight();
      },
    });
  }

  calculateTotalWeight(): void {
    this.totalWeight = this.categories
      .filter(c => c.isActive)
      .reduce((sum, c) => sum + c.weightage, 0);
    this.weightsValid = this.totalWeight === 100;
  }

  onWeightChange(category: any, event: Event): void {
    const input = event.target as HTMLInputElement;
    category.weightage = parseInt(input.value, 10) || 0;
    this.calculateTotalWeight();
  }

  saveWeights(): void {
    const weights = this.categories
      .filter(c => c.isActive)
      .map(c => ({ id: c.id, weightage: c.weightage }));

    this.apiService.updateCategoryWeights(weights).subscribe({
      next: () => {
        alert('Weights saved successfully');
        this.loadCategories();
      },
      error: (err) => alert(err.error?.message || 'Failed to save weights'),
    });
  }

  openForm(): void {
    this.editingCategory = null;
    this.formData = { name: '', description: '', weightage: 0, displayOrder: 0 };
    this.showForm = true;
  }

  editCategory(category: any): void {
    this.editingCategory = category;
    this.formData = {
      name: category.name,
      description: category.description || '',
      weightage: category.weightage,
      displayOrder: category.displayOrder,
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCategory = null;
  }

  saveCategory(): void {
    const request = this.editingCategory
      ? this.apiService.updateCategory(this.editingCategory.id, this.formData)
      : this.apiService.createCategory(this.formData);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadCategories();
      },
      error: (err) => alert(err.error?.message || 'Failed to save category'),
    });
  }

  confirmDelete(category: any): void {
    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  deleteCategory(): void {
    if (!this.categoryToDelete) return;

    this.apiService.deleteCategory(this.categoryToDelete.id).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.categoryToDelete = null;
        this.loadCategories();
      },
      error: (err) => alert(err.error?.message || 'Failed to delete category'),
    });
  }
}
