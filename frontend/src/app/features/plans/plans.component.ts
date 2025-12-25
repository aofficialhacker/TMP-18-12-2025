import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Plans Management</h2>
        <button class="btn btn-primary" (click)="openForm()">+ Add Plan</button>
      </div>

      <div class="filter-bar">
        <label>Filter by Company:</label>
        <select [(ngModel)]="selectedCompanyId" (change)="loadPlans()">
          <option [value]="null">All Companies</option>
          <option *ngFor="let company of companies" [value]="company.id">
            {{ company.name }}
          </option>
        </select>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th>Company</th>
              <th>Plan Name</th>
              <th>Status</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let plan of plans; let i = index">
              <td>{{ i + 1 }}</td>
              <td>{{ plan.company?.name }}</td>
              <td><strong>{{ plan.name }}</strong></td>

              <td>
                <span
                  class="badge"
                  [ngClass]="plan.status === 'upload_complete'
                    ? 'upload_complete'
                    : 'upload_pending'"
                >
                  {{ plan.status === 'upload_complete'
                    ? 'Upload Complete'
                    : 'Upload Pending' }}
                </span>
              </td>

              <td>
                <label class="switch">
                  <input
                    type="checkbox"
                    [checked]="plan.isActive"
                    (change)="toggleActive(plan)"
                  />
                  <span
                    class="slider"
                    [style.background]="plan.isActive ? '#4caf50' : '#e53935'"
                  ></span>
                </label>
              </td>

              <td>
                <button class="btn-icon" (click)="viewPlan(plan)" title="View">👁️</button>
                <button class="btn-icon" (click)="editPlan(plan)" title="Edit">✏️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add / Edit Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingPlan ? 'Edit Plan' : 'Add Plan' }}</h3>

          <form (ngSubmit)="savePlan()">
            <div class="form-group">
              <label>Company *</label>
              <select [(ngModel)]="formData.companyId" name="companyId" required>
                <option *ngFor="let company of companies" [value]="company.id">
                  {{ company.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Plan Name *</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required />
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                {{ editingPlan ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- View Modal -->
      <div class="modal-overlay" *ngIf="viewingPlan" (click)="viewingPlan = null">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <h3>{{ viewingPlan.name }}</h3>
          <p><strong>Company:</strong> {{ viewingPlan.company?.name }}</p>

          <!-- ✅ FIXED STATUS (ACCURATE) -->
          <p>
            <strong>Status:</strong>
            {{
              viewingPlan.status === 'upload_complete'
                ? 'Upload Complete'
                : 'Upload Pending'
            }}
          </p>

          <div class="form-actions">
            <button class="btn btn-secondary" (click)="viewingPlan = null">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* 🔒 CSS COMPLETELY UNCHANGED */
    .page-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .filter-bar { margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
    .filter-bar select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }
    .card { background: #fff; border-radius: 8px; padding: 20px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: center; border-bottom: 1px solid #eee; }
    .badge { padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
    .badge.upload_pending { background: #fff3e0; color: #e65100; }
    .badge.upload_complete { background: #e3f2fd; color: #1976d2; }
    .btn { padding: 10px 20px; border-radius: 6px; border: none; cursor: pointer; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; margin: 0 4px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; max-width: 500px; width: 100%; }
    .modal-lg { max-width: 700px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }

    .switch { position: relative; display: inline-block; width: 42px; height: 22px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; inset: 0; border-radius: 22px; transition: 0.3s; }
    .slider:before {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 2px;
      bottom: 2px;
      background: #fff;
      border-radius: 50%;
      transition: 0.3s;
    }
    input:checked + .slider:before { transform: translateX(20px); }
  `],
})
export class PlansComponent implements OnInit {
  private apiService = inject(ApiService);

  companies: any[] = [];
  plans: any[] = [];
  selectedCompanyId: number | null = null;

  showForm = false;
  editingPlan: any = null;
  viewingPlan: any = null;

  formData = { companyId: 0, name: '' };

  ngOnInit(): void {
    this.loadCompanies();
    this.loadPlans();
  }

  loadCompanies() {
    this.apiService.getCompanies().subscribe(c => this.companies = c);
  }

  loadPlans() {
    this.apiService
      .getPlans(this.selectedCompanyId || undefined, true)
      .subscribe(p => this.plans = p);
  }

  toggleActive(plan: any) {
    const newState = !plan.isActive;
    this.apiService.setPlanActive(plan.id, newState).subscribe(() => {
      plan.isActive = newState;
    });
  }

  openForm() {
    this.editingPlan = null;
    this.formData = { companyId: this.companies[0]?.id || 0, name: '' };
    this.showForm = true;
  }

  editPlan(plan: any) {
    this.editingPlan = plan;
    this.formData = { companyId: Number(plan.companyId), name: plan.name };
    this.showForm = true;
  }

  viewPlan(plan: any) {
    this.apiService.getPlan(plan.id).subscribe(p => this.viewingPlan = p);
  }

  closeForm() {
    this.showForm = false;
    this.editingPlan = null;
  }

  savePlan() {
    const payload = { ...this.formData, companyId: Number(this.formData.companyId) };
    const req = this.editingPlan
      ? this.apiService.updatePlan(this.editingPlan.id, payload)
      : this.apiService.createPlan(payload);

    req.subscribe(() => {
      this.closeForm();
      this.loadPlans();
    });
  }
}
