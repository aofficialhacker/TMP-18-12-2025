import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <h2>Dashboard Overview</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon companies">🏢</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.companies }}</span>
            <span class="stat-label">Companies</span>
          </div>
          <a routerLink="/companies" class="stat-link">View all</a>
        </div>

        <div class="stat-card">
          <div class="stat-icon categories">📁</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.categories }}</span>
            <span class="stat-label">Categories</span>
          </div>
          <a routerLink="/categories" class="stat-link">View all</a>
        </div>

        <div class="stat-card">
          <div class="stat-icon features">✨</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.features }}</span>
            <span class="stat-label">Features</span>
          </div>
          <a routerLink="/features" class="stat-link">View all</a>
        </div>

        <div class="stat-card">
          <div class="stat-icon plans">📋</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.plans }}</span>
            <span class="stat-label">Plans</span>
          </div>
          <a routerLink="/plans" class="stat-link">View all</a>
        </div>
      </div>

      <div class="sections-grid">
        <div class="section-card">
          <h3>Weight Validation</h3>
          <div class="validation-status" [class.valid]="categoryWeightsValid" [class.invalid]="!categoryWeightsValid">
            <span class="status-icon">{{ categoryWeightsValid ? '✓' : '✗' }}</span>
            <span>Category Weights: {{ categoryWeightsTotal }}% / 100%</span>
          </div>
          <p class="help-text">Category weights must sum to 100% for proper scoring.</p>
          <a routerLink="/categories" class="btn btn-primary">Manage Weights</a>
        </div>

        <div class="section-card">
          <h3>Quick Actions</h3>
          <div class="quick-actions">
            <a routerLink="/extraction/upload" class="action-btn">
              <span class="action-icon">📤</span>
              <span>Upload Brochure</span>
            </a>
            <a routerLink="/companies" [queryParams]="{action: 'new'}" class="action-btn">
              <span class="action-icon">🏢</span>
              <span>Add Company</span>
            </a>
            <a routerLink="/plans" [queryParams]="{action: 'new'}" class="action-btn">
              <span class="action-icon">📋</span>
              <span>Add Plan</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 20px;
    }

    h2 {
      margin: 0 0 24px;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .stat-icon {
      font-size: 2rem;
      margin-bottom: 12px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      color: #666;
    }

    .stat-link {
      color: #4a9eff;
      text-decoration: none;
      font-size: 0.9rem;
      margin-top: 12px;
    }

    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .section-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .section-card h3 {
      margin: 0 0 16px;
      color: #333;
    }

    .validation-status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .validation-status.valid {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .validation-status.invalid {
      background: #ffebee;
      color: #c62828;
    }

    .status-icon {
      font-weight: bold;
    }

    .help-text {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 16px;
    }

    .btn {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: #4a9eff;
      color: #fff;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: #e8e8e8;
    }

    .action-icon {
      font-size: 1.2rem;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);

  stats = {
    companies: 0,
    categories: 0,
    features: 0,
    plans: 0,
  };

  categoryWeightsValid = false;
  categoryWeightsTotal = 0;

  ngOnInit(): void {
    this.loadStats();
    this.checkCategoryWeights();
  }

  loadStats(): void {
    forkJoin({
      companies: this.apiService.getCompanies(),
      categories: this.apiService.getCategories(),
      features: this.apiService.getFeatures(),
      plans: this.apiService.getPlans(),
    }).subscribe({
      next: (data) => {
        this.stats = {
          companies: data.companies.length,
          categories: data.categories.length,
          features: data.features.length,
          plans: data.plans.length,
        };
      },
    });
  }

  checkCategoryWeights(): void {
    this.apiService.validateCategoryWeights().subscribe({
      next: (result) => {
        this.categoryWeightsValid = result.valid;
        this.categoryWeightsTotal = result.total;
      },
    });
  }
}
