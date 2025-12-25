import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Categories Management</h2>
        <button class="btn btn-primary" (click)="openForm()">+ Add Category</button>
      </div>

      <div
        class="weight-info"
        [class.valid]="weightsValid"
        [class.partial]="weightsPartial && !weightsValid"
        [class.invalid]="!weightsValid && !weightsPartial"
      >
        <span>Total Weight: {{ totalWeight }}% / 100%</span>
        <span>
          {{
            weightsValid
              ? 'Valid'
              : weightsPartial
              ? 'Weight space available'
              : 'Weights must sum to 100%'
          }}
        </span>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Weightage</th>
              <th>Features</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let category of categories">
              <td><strong>{{ category.name }}</strong></td>
              <td>{{ category.description || '-' }}</td>
              <td>{{ category.weightage }}%</td>
              <td>{{ category.features?.length || 0 }}</td>

              <td>
                <span
                  class="badge"
                  [class.active]="category.isActive"
                  [class.inactive]="!category.isActive"
                >
                  {{ category.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td class="actions">
                <button class="btn-icon" (click)="editCategory(category)">✏️</button>
                <label class="switch">
                  <input
                    type="checkbox"
                    [checked]="category.isActive"
                    (click)="onToggleClick($event, category)"
                  />
                  <span class="slider"></span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="showForm">
        <div class="modal">
          <h3>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</h3>

          <form (ngSubmit)="saveCategory()">
            <div class="form-group">
              <label>Category Name *</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea rows="3" [(ngModel)]="formData.description" name="description"></textarea>
            </div>

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

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                {{ editingCategory ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ================= GLOBAL BUTTONS ================= */
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
    }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }

    /* ================= PAGE ================= */
    .page-container { padding: 20px; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    /* ================= WEIGHT INFO ================= */
    .weight-info {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      font-weight: 500;
    }
    .weight-info.valid { background: #e8f5e9; color: #2e7d32; }
    .weight-info.invalid { background: #ffebee; color: #c62828; }
    .weight-info.partial { background: #fff8e1; color: #f57f17; }

    /* ================= TABLE ================= */
    .card { background: #fff; border-radius: 8px; padding: 20px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th,
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      text-align: left;
    }

    /* ================= BADGES ================= */
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #ffebee; color: #c62828; }

    /* ================= ACTIONS ================= */
    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }

    /* ================= TOGGLE ================= */
    .switch { position: relative; width: 44px; height: 24px; }
    .switch input { display: none; }
    .slider {
      position: absolute;
      inset: 0;
      background: #f44336;
      border-radius: 24px;
      transition: 0.3s;
    }
    .slider::before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      bottom: 3px;
      background: #fff;
      border-radius: 50%;
      transition: 0.3s;
    }
    input:checked + .slider { background: #4caf50; }
    input:checked + .slider::before { transform: translateX(20px); }

    /* ================= MODAL ================= */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 500px;
    }
    .modal h3 {
      margin: 0 0 20px;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .form-group { margin-bottom: 16px; }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }
  `]
})
export class CategoriesComponent implements OnInit {
  private apiService = inject(ApiService);

  categories: any[] = [];
  showForm = false;
  editingCategory: any = null;

  formData: any = {
    name: '',
    description: '',
    weightage: 0
  };

  totalWeight = 0;
  weightsValid = false;
  weightsPartial = false;

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.apiService.getCategories(true).subscribe(res => {
      this.categories = res;
      this.calculateTotalWeight();
    });
  }

  calculateTotalWeight() {
    this.totalWeight = this.categories
      .filter(c => c.isActive)
      .reduce((sum, c) => sum + c.weightage, 0);

    this.weightsValid = this.totalWeight === 100;
    this.weightsPartial = this.totalWeight < 100;
  }

  getActiveWeightExcluding(id?: number): number {
    return this.categories
      .filter(c => c.isActive && c.id !== id)
      .reduce((sum, c) => sum + c.weightage, 0);
  }

  onToggleClick(event: MouseEvent, category: any) {
    event.preventDefault();

    if (category.isActive) {
      this.apiService.updateCategory(category.id, { isActive: false })
        .subscribe(() => this.loadCategories());
      return;
    }

    const activeTotal = this.getActiveWeightExcluding();
    if (activeTotal + category.weightage > 100) {
      alert('Total weight exceeds 100%.');
      return;
    }

    this.apiService.updateCategory(category.id, { isActive: true })
      .subscribe(() => this.loadCategories());
  }

  openForm() {
    this.editingCategory = null;
    this.formData = { name: '', description: '', weightage: 0 };
    this.showForm = true;
  }

  editCategory(category: any) {
    this.editingCategory = category;
    this.formData = {
      name: category.name,
      description: category.description,
      weightage: category.weightage
    };
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  saveCategory() {
    const editedWeight = Number(this.formData.weightage);
    const isActive = this.editingCategory ? this.editingCategory.isActive : true;

    const activeWeightExcluding = this.getActiveWeightExcluding(this.editingCategory?.id);

    if (isActive && activeWeightExcluding + editedWeight > 100) {
      alert('Total active category weight cannot exceed 100%.');
      return;
    }

    const payload: any = {
      name: this.formData.name,
      description: this.formData.description,
      weightage: editedWeight,
      isActive
    };

    const req = this.editingCategory
      ? this.apiService.updateCategory(this.editingCategory.id, payload)
      : this.apiService.createCategory(payload);

    req.subscribe(() => {
      this.closeForm();
      this.loadCategories();
    });
  }
}
