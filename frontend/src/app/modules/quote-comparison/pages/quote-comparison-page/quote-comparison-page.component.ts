import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { SelectedPlan } from '../../models/plan.model';
import { ComparisonResult } from '../../models/comparison.model';

import { PlanSelectionCardComponent } from '../../components/plan-selection-card/plan-selection-card.component';
import { QuoteCardComponent } from '../../components/quote-card/quote-card.component';

@Component({
  selector: 'app-quote-comparison-page',
  standalone: true,
  imports: [
    CommonModule,
    PlanSelectionCardComponent,
    QuoteCardComponent
  ],
  templateUrl: './quote-comparison-page.component.html',
  styleUrls: ['./quote-comparison-page.component.scss']
})
export class QuoteComparisonPageComponent {

  selectedPlans: SelectedPlan[] = [{}, {}, {}];
  comparisonResult: ComparisonResult | null = null;
  isLoading = false;

  constructor(private http: HttpClient) {}

  trackByIndex(index: number): number {
    return index;
  }

  onPlanChange(index: number, data: SelectedPlan): void {
    this.selectedPlans[index] = {
      ...this.selectedPlans[index],
      ...data
    };
  }

  getExcludedPlanIds(currentIndex: number): number[] {
    return this.selectedPlans
      .map((p, i) => (i !== currentIndex ? Number(p.planId) : null))
      .filter((id): id is number => typeof id === 'number' && !isNaN(id));
  }

  /**
   * ✅ VALID IF AT LEAST 2 PLANS ARE FULLY SELECTED
   */
  isFormValid(): boolean {
    const validPlans = this.selectedPlans.filter(p =>
      !!p.companyId &&
      !!p.planId &&
      !!p.sumInsured &&
      !!p.premium
    );

    return validPlans.length >= 2;
  }

  /**
   * ✅ COMPARE ONLY SELECTED (2 OR 3) PLANS
   * ✅ PRESERVE USER SELECTION ORDER
   */
  comparePlans(): void {
    if (!this.isFormValid()) {
      alert('Please select at least 2 plans to compare');
      return;
    }

    const validPlans = this.selectedPlans.filter(p =>
      !!p.companyId &&
      !!p.planId &&
      !!p.sumInsured &&
      !!p.premium
    );

    const payload = {
      client: {
        name: 'Client',
        dob: '',
        age: null,
        preExistingDisease: false,
        planType: '',
        policyType: ''
      },
      selectedPlanIds: validPlans.map(p => Number(p.planId)),
      selectedPlans: validPlans
    };

    this.isLoading = true;

    this.http.post<ComparisonResult>('/plans/compare', payload).subscribe({
      next: (res: ComparisonResult) => {

        /* 🔒 PRESERVE SELECTION ORDER */
        const orderMap = new Map<number, number>();
        validPlans.forEach((p, index) => {
          orderMap.set(Number(p.planId), index);
        });

        /* ✅ Reorder plans */
        res.plans = [...res.plans].sort((a, b) => {
          return (orderMap.get(a.planId) ?? 0) - (orderMap.get(b.planId) ?? 0);
        });

        /* ✅ Reorder featureValues (TYPE SAFE) */
        if (res.featureValues) {
          const reorderedFeatureValues: {
            [featureId: number]: { [planId: number]: string };
          } = {};

          Object.keys(res.featureValues).forEach((featureKey) => {
            const featureId = Number(featureKey);
            const valuesForFeature = res.featureValues![featureId];

            const reorderedValues: { [planId: number]: string } = {};

            res.plans.forEach(plan => {
              reorderedValues[plan.planId] = valuesForFeature?.[plan.planId] ?? '';
            });

            reorderedFeatureValues[featureId] = reorderedValues;
          });

          res.featureValues = reorderedFeatureValues;
        }

        this.comparisonResult = res;
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('Comparison failed', err);
        alert('Failed to compare plans');
        this.isLoading = false;
      }
    });
  }
}
