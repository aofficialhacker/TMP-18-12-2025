import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SelectedPlan } from '../../models/plan.model';
import { PlanDataService, Company, Plan } from '../../services/plan-data.service';

@Component({
  selector: 'app-plan-selection-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">

      <div class="card-title">
        Plan {{ index + 1 }}
      </div>

      <!-- Company -->
      <div class="field">
        <label>Company</label>
        <select [(ngModel)]="companyId" (change)="onCompanyChange()">
          <option [ngValue]="undefined">Select Company</option>
          <option *ngFor="let c of companies" [ngValue]="c.id">
            {{ c.name }}
          </option>
        </select>
      </div>

      <!-- Plan -->
      <div class="field">
        <label>Plan</label>
        <select
          [(ngModel)]="planId"
          (change)="emitChange()"
          [disabled]="plans.length === 0">
          <option [ngValue]="undefined">Select Plan</option>
          <option *ngFor="let p of filteredPlans()" [ngValue]="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>

      <!-- Sum Insured -->
      <div class="field">
        <label>Sum Insured</label>
        <div class="currency-input">
          <span class="currency">₹</span>
          <input
            type="text"
            placeholder="Eg: 10,00,000"
            [value]="format(sumInsured)"
            (input)="onCurrencyInput($event, 'sumInsured')" />
        </div>
      </div>

      <!-- Premium -->
      <div class="field">
        <label>Premium</label>
        <div class="currency-input">
          <span class="currency">₹</span>
          <input
            type="text"
            placeholder="Eg: 12,500"
            [value]="format(premium)"
            (input)="onCurrencyInput($event, 'premium')" />
        </div>
      </div>

    </div>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border-radius: 14px;
      padding: 22px;
      box-shadow: 0 10px 28px rgba(0,0,0,0.08);
      border: 1px solid #e3e8f0;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 40px rgba(0,0,0,0.12);
    }

    .card-title {
      text-align: center;
      font-size: 16px;
      font-weight: 700;
      color: #2f5fa7;
      margin-bottom: 6px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 12px;
      font-weight: 600;
      color: #4a5568;
    }

    select,
    input {
      height: 44px;
      border-radius: 10px;
      border: 1px solid #cfd6e3;
      padding: 0 14px;
      font-size: 14px;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
    }

    select:focus,
    input:focus {
      border-color: #2f5fa7;
      box-shadow: 0 0 0 3px rgba(47,95,167,0.15);
    }

    /* Currency input */
    .currency-input {
      display: flex;
      align-items: center;
      height: 44px;
      border-radius: 10px;
      border: 1px solid #cfd6e3;
      padding-left: 12px;
      background: #fff;
    }

    .currency {
      font-weight: 700;
      color: #4a5568; /* ✅ requested color */
      margin-right: 6px;
    }

    .currency-input input {
      border: none;
      height: 100%;
      padding: 0;
      flex: 1;
      font-weight: 600;
    }

    .currency-input input:focus {
      box-shadow: none;
    }
  `]
})
export class PlanSelectionCardComponent implements OnInit {

  @Input() excludedPlanIds: number[] = [];
  @Input() index = 0;   // ✅ for Plan 1 / 2 / 3
  @Output() planChange = new EventEmitter<SelectedPlan>();

  companies: Company[] = [];
  plans: Plan[] = [];

  companyId: number | undefined;
  planId: number | undefined;
  sumInsured: number | undefined;
  premium: number | undefined;

  constructor(private planDataService: PlanDataService) {}

  ngOnInit(): void {
    this.planDataService.getCompanies().subscribe(data => {
      this.companies = data;
    });
  }

  onCompanyChange(): void {
    this.planId = undefined;
    this.plans = [];

    if (!this.companyId) {
      this.emitChange();
      return;
    }

    this.planDataService.getPlansByCompany(this.companyId).subscribe(data => {
      this.plans = data;
      this.emitChange();
    });
  }

  filteredPlans(): Plan[] {
    return this.plans.filter(p =>
      !this.excludedPlanIds.includes(Number(p.id)) ||
      Number(p.id) === Number(this.planId)
    );
  }

  emitChange(): void {
    const company = this.companies.find(c => c.id === this.companyId);
    const plan = this.plans.find(p => p.id === this.planId);

    this.planChange.emit({
      companyId: this.companyId !== undefined ? String(this.companyId) : undefined,
      companyName: company?.name,
      planId: this.planId !== undefined ? String(this.planId) : undefined,
      planName: plan?.name,
      sumInsured: this.sumInsured,
      premium: this.premium
    });
  }

  /* ₹ FORMATTER */
  format(value: number | undefined): string {
    return value ? value.toLocaleString('en-IN') : '';
  }

  onCurrencyInput(event: Event, field: 'sumInsured' | 'premium'): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/,/g, '').replace(/\D/g, '');
    const num = raw ? Number(raw) : undefined;

    this[field] = num;
    this.emitChange();

    input.value = num ? num.toLocaleString('en-IN') : '';
  }
}
