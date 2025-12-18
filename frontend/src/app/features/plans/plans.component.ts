import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent],
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
          <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
        </select>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Company</th>
              <th>Sum Insured</th>
              <th>Features</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let plan of plans">
              <td><strong>{{ plan.name }}</strong></td>
              <td>{{ plan.company?.name }}</td>
              <td>{{ formatSumInsured(plan) }}</td>
              <td>{{ plan.featureValues?.length || 0 }}</td>
              <td>
                <span class="badge" [ngClass]="plan.status">{{ plan.status }}</span>
              </td>
              <td>
                <button class="btn-icon" (click)="viewPlan(plan)" title="View">👁️</button>
                <button class="btn-icon" (click)="editPlan(plan)" title="Edit">✏️</button>
                <button class="btn-icon" (click)="confirmDelete(plan)" title="Delete">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingPlan ? 'Edit Plan' : 'Add Plan' }}</h3>
          <form (ngSubmit)="savePlan()">
            <div class="form-group">
              <label>Company *</label>
              <select [(ngModel)]="formData.companyId" name="companyId" required>
                <option *ngFor="let company of companies" [value]="company.id">{{ company.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Plan Name *</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Min Sum Insured</label>
                <input type="number" [(ngModel)]="formData.sumInsuredMin" name="sumInsuredMin" />
              </div>
              <div class="form-group">
                <label>Max Sum Insured</label>
                <input type="number" [(ngModel)]="formData.sumInsuredMax" name="sumInsuredMax" />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="formData.description" name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select [(ngModel)]="formData.status" name="status">
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ editingPlan ? 'Update' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- View Plan Modal -->
      <div class="modal-overlay" *ngIf="viewingPlan" (click)="viewingPlan = null">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <h3>{{ viewingPlan.name }}</h3>
          <p><strong>Company:</strong> {{ viewingPlan.company?.name }}</p>
          <p><strong>Sum Insured:</strong> {{ formatSumInsured(viewingPlan) }}</p>
          <p><strong>Status:</strong> {{ viewingPlan.status }}</p>

          <h4>Feature Values</h4>
          <div class="feature-values" *ngIf="viewingPlan.featureValues?.length">
            <div *ngFor="let fv of viewingPlan.featureValues" class="feature-item">
              <span class="feature-name">{{ fv.feature?.name }}</span>
              <span class="feature-value">{{ fv.verifiedValue || fv.extractedValue || '-' }}</span>
              <span class="verified-badge" *ngIf="fv.isVerified">✓</span>
            </div>
          </div>
          <p *ngIf="!viewingPlan.featureValues?.length" class="no-features">No feature values yet</p>

          <div class="form-actions">
            <button class="btn btn-secondary" (click)="viewingPlan = null">Close</button>
          </div>
        </div>
      </div>

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Plan"
        [message]="'Are you sure you want to delete ' + planToDelete?.name + '?'"
        (confirmed)="deletePlan()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .filter-bar { margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
    .filter-bar select { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; }
    .card { background: #fff; border-radius: 8px; padding: 20px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; text-transform: capitalize; }
    .badge.draft { background: #fff3e0; color: #e65100; }
    .badge.pending_review { background: #e3f2fd; color: #1565c0; }
    .badge.published { background: #e8f5e9; color: #2e7d32; }
    .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal-lg { max-width: 700px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
    .feature-values { max-height: 300px; overflow-y: auto; }
    .feature-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; }
    .feature-name { font-weight: 500; }
    .verified-badge { color: #2e7d32; }
    .no-features { color: #666; font-style: italic; }
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
  formData = { companyId: 0, name: '', sumInsuredMin: null, sumInsuredMax: null, description: '', status: 'draft' };

  showDeleteConfirm = false;
  planToDelete: any = null;

  ngOnInit(): void {
    this.loadCompanies();
    this.loadPlans();
  }

  loadCompanies(): void {
    this.apiService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies;
        if (companies.length && !this.formData.companyId) {
          this.formData.companyId = companies[0].id;
        }
      },
    });
  }

  loadPlans(): void {
    const companyId = this.selectedCompanyId ? this.selectedCompanyId : undefined;
    this.apiService.getPlans(companyId, true).subscribe({
      next: (plans) => this.plans = plans,
    });
  }

  formatSumInsured(plan: any): string {
    if (plan.sumInsuredMin && plan.sumInsuredMax) {
      return `₹${this.formatAmount(plan.sumInsuredMin)} - ₹${this.formatAmount(plan.sumInsuredMax)}`;
    }
    if (plan.sumInsuredMax) {
      return `Up to ₹${this.formatAmount(plan.sumInsuredMax)}`;
    }
    return '-';
  }

  formatAmount(amount: number): string {
    if (amount >= 10000000) return (amount / 10000000).toFixed(1) + ' Cr';
    if (amount >= 100000) return (amount / 100000).toFixed(1) + ' L';
    return amount.toString();
  }

  openForm(): void {
    this.editingPlan = null;
    this.formData = { companyId: this.companies[0]?.id || 0, name: '', sumInsuredMin: null, sumInsuredMax: null, description: '', status: 'draft' };
    this.showForm = true;
  }

  editPlan(plan: any): void {
    this.editingPlan = plan;
    this.formData = {
      companyId: plan.companyId,
      name: plan.name,
      sumInsuredMin: plan.sumInsuredMin,
      sumInsuredMax: plan.sumInsuredMax,
      description: plan.description || '',
      status: plan.status,
    };
    this.showForm = true;
  }

  viewPlan(plan: any): void {
    this.apiService.getPlan(plan.id).subscribe({
      next: (fullPlan) => this.viewingPlan = fullPlan,
    });
  }

  closeForm(): void {
    this.showForm = false;
    this.editingPlan = null;
  }

  savePlan(): void {
    const request = this.editingPlan
      ? this.apiService.updatePlan(this.editingPlan.id, this.formData)
      : this.apiService.createPlan(this.formData);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadPlans();
      },
      error: (err) => alert(err.error?.message || 'Failed to save plan'),
    });
  }

  confirmDelete(plan: any): void {
    this.planToDelete = plan;
    this.showDeleteConfirm = true;
  }

  deletePlan(): void {
    if (!this.planToDelete) return;
    this.apiService.deletePlan(this.planToDelete.id).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.planToDelete = null;
        this.loadPlans();
      },
    });
  }
}
