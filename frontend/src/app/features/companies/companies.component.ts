import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Companies Management</h2>
        <button class="btn btn-primary" (click)="openForm()">+ Add Company</button>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Description</th>
              <th>Plans</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let company of companies">
              <td><strong>{{ company.name }}</strong></td>
              <td>{{ company.description || '-' }}</td>
              <td>{{ company.plans?.length || 0 }}</td>
              <td>
                <span class="badge" [class.active]="company.isActive">
                  {{ company.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>{{ company.createdAt | date:'mediumDate' }}</td>
              <td>
                <button class="btn-icon" (click)="editCompany(company)">✏️</button>
                <button class="btn-icon" (click)="confirmDelete(company)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Form Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingCompany ? 'Edit Company' : 'Add Company' }}</h3>
          <form (ngSubmit)="saveCompany()">
            <div class="form-group">
              <label>Company Name *</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required />
            </div>
            <div class="form-group">
              <label>Logo URL</label>
              <input type="text" [(ngModel)]="formData.logoUrl" name="logoUrl" placeholder="https://..." />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="formData.description" name="description" rows="3"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">{{ editingCompany ? 'Update' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>

      <app-confirm-dialog
        [isOpen]="showDeleteConfirm"
        title="Delete Company"
        [message]="'Are you sure you want to delete ' + companyToDelete?.name + '?'"
        (confirmed)="deleteCompany()"
        (cancelled)="showDeleteConfirm = false"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card { background: #fff; border-radius: 8px; padding: 20px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 500px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  `],
})
export class CompaniesComponent implements OnInit {
  private apiService = inject(ApiService);

  companies: any[] = [];
  showForm = false;
  editingCompany: any = null;
  formData = { name: '', logoUrl: '', description: '' };

  showDeleteConfirm = false;
  companyToDelete: any = null;

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.apiService.getCompanies(true).subscribe({
      next: (companies) => this.companies = companies,
    });
  }

  openForm(): void {
    this.editingCompany = null;
    this.formData = { name: '', logoUrl: '', description: '' };
    this.showForm = true;
  }

  editCompany(company: any): void {
    this.editingCompany = company;
    this.formData = {
      name: company.name,
      logoUrl: company.logoUrl || '',
      description: company.description || '',
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCompany = null;
  }

  saveCompany(): void {
    const request = this.editingCompany
      ? this.apiService.updateCompany(this.editingCompany.id, this.formData)
      : this.apiService.createCompany(this.formData);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadCompanies();
      },
      error: (err) => alert(err.error?.message || 'Failed to save company'),
    });
  }

  confirmDelete(company: any): void {
    this.companyToDelete = company;
    this.showDeleteConfirm = true;
  }

  deleteCompany(): void {
    if (!this.companyToDelete) return;
    this.apiService.deleteCompany(this.companyToDelete.id).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.companyToDelete = null;
        this.loadCompanies();
      },
    });
  }
}
