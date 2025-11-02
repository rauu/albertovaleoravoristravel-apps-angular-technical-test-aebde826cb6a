import { render, screen, fireEvent, within } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HotelCardComponent } from './hotel-card.component';
import { Hotel } from '../../../../../../shared/models/hotel.model';

describe('HotelCardComponent - User Behavior', () => {

  const mockHotel: Hotel = {
    id: 'hotel-1',
    name: 'Grand Paradise Hotel',
    address: '123 Beach Avenue, Miami',
    rate: 4.5,
    stars: 4,
    price: 150,
    image: '/assets/grand-paradise.jpg'
  };

  async function renderHotelCard(hotel: Hotel = mockHotel) {
    return render(HotelCardComponent, {
      imports: [TranslateModule.forRoot()],
      componentInputs: { hotel }
    });
  }

  describe('User can see hotel information', () => {
    it('should display hotel name prominently', async () => {
      await renderHotelCard();

      // User should easily see the hotel name
      const hotelName = screen.getByText('Grand Paradise Hotel');
      expect(hotelName).toBeTruthy();
    });

    it('should display hotel address', async () => {
      await renderHotelCard();

      // User should see where the hotel is located
      const address = screen.getByText(/123 Beach Avenue, Miami/i);
      expect(address).toBeTruthy();
    });

    it('should display hotel price', async () => {
      await renderHotelCard();

      // User should see how much the hotel costs
      const price = screen.getByText(/150/);
      expect(price).toBeTruthy();
    });

    it('should display hotel rating', async () => {
      await renderHotelCard();

      // User should see the hotel rating
      const rating = screen.getByText(/4\.5/);
      expect(rating).toBeTruthy();
    });

    it('should display star classification', async () => {
      await renderHotelCard();

      // User should see the hotel star rating (4 stars)
      const stars = screen.getByText(/^4⭐$/);
      expect(stars).toBeTruthy();
    });
  });

  describe('User can interact with hotel card', () => {
    it('should allow user to view hotel details by clicking button', async () => {
      const { fixture } = await renderHotelCard();
      let clickedHotelId: string | undefined;

      fixture.componentInstance.onViewDetails.subscribe((id: string) => {
        clickedHotelId = id;
      });

      // User clicks on "View Details" or similar button
      const detailsButton = screen.getByRole('button');
      await fireEvent.click(detailsButton);

      expect(clickedHotelId).toBe('hotel-1');
    });

    it('should show hotel image with alt text for accessibility', async () => {
      await renderHotelCard();

      // User should see hotel image, screen readers should have alt text
      const hotelImage = screen.getByRole('img');
      expect(hotelImage).toBeTruthy();
      expect(hotelImage.getAttribute('alt')).toContain('Grand Paradise Hotel');
    });
  });

  describe('Visual states and user feedback', () => {
    it('should display budget-friendly hotel differently', async () => {
      const budgetHotel: Hotel = {
        ...mockHotel,
        price: 50,
        stars: 2
      };

      await renderHotelCard(budgetHotel);

      // User should see the lower price
      const price = screen.getByText(/50/);
      expect(price).toBeTruthy();
    });

    it('should display luxury hotel with higher price', async () => {
      const luxuryHotel: Hotel = {
        ...mockHotel,
        name: 'Luxury Resort & Spa',
        price: 500,
        stars: 5,
        rate: 4.9
      };

      await renderHotelCard(luxuryHotel);

      // User should see premium pricing
      const price = screen.getByText(/500/);
      expect(price).toBeTruthy();

      // User should see high rating
      const rating = screen.getByText(/4\.9/);
      expect(rating).toBeTruthy();
    });
  });

  describe('Component behavior edge cases', () => {
    it('should handle missing hotel image gracefully', async () => {
      const hotelWithoutImage: Hotel = {
        ...mockHotel,
        image: ''
      };

      await renderHotelCard(hotelWithoutImage);

      // Component should still render without errors
      const hotelName = screen.getByText('Grand Paradise Hotel');
      expect(hotelName).toBeTruthy();
    });

    it('should display low-rated hotel', async () => {
      const lowRatedHotel: Hotel = {
        ...mockHotel,
        rate: 2.1
      };

      await renderHotelCard(lowRatedHotel);

      // User should see the honest rating
      const rating = screen.getByText(/2\.1/);
      expect(rating).toBeTruthy();
    });
  });

  describe('Semantic HTML and Accessibility', () => {
    it('should use semantic heading for hotel name', async () => {
      await renderHotelCard();

      // Hotel name should be in a heading for proper document structure
      const heading = screen.getByRole('heading', { name: /Grand Paradise Hotel/i });
      expect(heading).toBeTruthy();
    });

    it('should have accessible button with clear purpose', async () => {
      await renderHotelCard();

      // Button should be accessible and its purpose clear
      const button = screen.getByRole('button');
      expect(button).toBeTruthy();
      expect(button.textContent?.length).toBeGreaterThan(0);
    });
  });
});
