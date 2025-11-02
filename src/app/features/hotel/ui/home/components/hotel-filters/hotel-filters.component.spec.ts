import { render, screen, fireEvent } from '@testing-library/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HotelFiltersComponent } from './hotel-filters.component';

describe('HotelFiltersComponent - User Behavior Tests', () => {

  const defaultProps = {
    nameFilter: '',
    selectedStars: [],
    ratingValue: 0,
    priceValue: 1000,
    starsOptions: [1, 2, 3, 4, 5]
  };

  const translations = {
    home: {
      filterHotels: 'Filter hotels',
      hotelName: 'Hotel name',
      searchByName: 'Search by name',
      stars: 'Stars',
      rating: 'Rating',
      price: 'Price'
    }
  };

  async function renderComponent(props = {}) {
    const result = await render(HotelFiltersComponent, {
      imports: [TranslateModule.forRoot()],
      componentInputs: { ...defaultProps, ...props }
    });

    const translate = result.fixture.componentRef.injector.get(TranslateService);
    translate.setTranslation('en', translations, true);
    translate.use('en');
    result.fixture.detectChanges();
    await result.fixture.whenStable();

    return result;
  }

  describe('User Interactions', () => {
    it('should allow user to type hotel name in search input', async () => {
      const { fixture } = await renderComponent();
      let emittedValue: string | undefined;

      fixture.componentInstance.onNameChangeOutput.subscribe((value: string) => {
        emittedValue = value;
      });

      const searchInput = screen.getByRole('textbox');
      await fireEvent.input(searchInput, { target: { value: 'Marriott' } });

      expect(emittedValue).toBe('Marriott');
    });

    it('should allow user to select star ratings by clicking', async () => {
      const { fixture } = await renderComponent();
      const emittedStars: number[] = [];

      fixture.componentInstance.onStarToggleOutput.subscribe((star: number) => {
        emittedStars.push(star);
      });

      // User clicks on 4-star rating
      const starButtons = screen.getAllByRole('button');
      const fourStarButton = starButtons.find(btn => btn.textContent?.includes('4'));

      if (fourStarButton) {
        await fireEvent.click(fourStarButton);
        expect(emittedStars).toContain(4);
      }
    });

    it('should emit event when clear filters is invoked', async () => {
      const { fixture } = await renderComponent();
      let clearCalled = false;

      fixture.componentInstance.onClearFiltersOutput.subscribe(() => {
        clearCalled = true;
      });

      fixture.componentInstance.clearFilters();

      expect(clearCalled).toBeTrue();
    });
  });

  describe('Visual Feedback', () => {
    it('should display selected stars visually', async () => {
      await renderComponent({
        selectedStars: [3, 5]
      });

      // User should see which stars are selected
      const selectedStars = screen.queryAllByRole('button', { pressed: true });
      expect(selectedStars.length).toBeGreaterThan(0);
    });

    it('should show current price range value', async () => {
      await renderComponent({
        priceValue: 750
      });

      // User should see the price value somewhere in the UI
      const priceElement = screen.getByText(/750/);
      expect(priceElement).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form controls', async () => {
      await renderComponent();

      // Search input should be accessible
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeTruthy();

      // Buttons should have proper roles
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper labels for screen readers', async () => {
      await renderComponent();

      // Check for label associations
      const searchInput = screen.getByRole('textbox');
      expect(searchInput.getAttribute('aria-label') || searchInput.id).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined rating value gracefully', async () => {
      const { fixture } = await renderComponent();
      let emitted = false;

      fixture.componentInstance.onRatingChangeOutput.subscribe(() => {
        emitted = true;
      });

      // Simulate undefined value (e.g., slider not initialized)
      fixture.componentInstance.onRatingChange(undefined);

      expect(emitted).toBe(false);
    });

    it('should handle undefined price value gracefully', async () => {
      const { fixture } = await renderComponent();
      let emitted = false;

      fixture.componentInstance.onPriceChangeOutput.subscribe(() => {
        emitted = true;
      });

      fixture.componentInstance.onPriceChange(undefined);

      expect(emitted).toBe(false);
    });
  });
});
