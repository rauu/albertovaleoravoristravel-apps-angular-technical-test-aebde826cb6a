import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavBarComponent } from './nav-bar.component';
import { environment } from '../../../../environments/environment';

interface SetupOptions {
  savedLanguage?: string;
}

describe('NavBarComponent', () => {
  async function setup(options: SetupOptions = {}) {
    localStorage.clear();
    if (options.savedLanguage) {
      localStorage.setItem('language', options.savedLanguage);
    }

    const renderResult = await render(NavBarComponent, {
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [provideRouter([])]
    });

    const translate = renderResult.fixture.componentRef.injector.get(TranslateService);
    translate.setTranslation('es', { navbar: { title: 'Avoristech Travel', language: 'Idioma' } }, true);
    translate.setTranslation('en', { navbar: { title: 'Avoristech Travel', language: 'Language' } }, true);
    translate.setDefaultLang(environment.defaultLanguage);

    // Trigger change detection after translations are in place
    renderResult.fixture.detectChanges();

    return {
      ...renderResult,
      translate
    };
  }

  afterEach(() => {
    localStorage.clear();
  });

  it('renders brand link with accessible label', async () => {
    await setup();

    const homeLink = screen.getByRole('link', { name: /avoristech travel/i });
    expect(homeLink).toBeTruthy();
  });

  it('shows default language when no preference stored', async () => {
    const { fixture, translate } = await setup();
    const component = fixture.componentInstance;

    expect(component.selectedLanguage.code).toBe(environment.defaultLanguage);
    expect(translate.currentLang).toBe(environment.defaultLanguage);
  });

  it('uses saved language from localStorage', async () => {
    const { fixture, translate } = await setup({ savedLanguage: 'en' });
    const component = fixture.componentInstance;

    expect(component.selectedLanguage.code).toBe('en');
    expect(translate.currentLang).toBe('en');
  });

  it('persists language choice when user changes selection', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;

    const englishLang = component.languages.find(lang => lang.code === 'en');
    component.onLanguageChange({ value: englishLang });
    fixture.detectChanges();

    expect(localStorage.getItem('language')).toBe('en');
  });

  it('tracks languages by unique code', async () => {
    const { fixture } = await setup();
    const component = fixture.componentInstance;

    const first = component.trackByLanguageCode(0, component.languages[0]);
    const second = component.trackByLanguageCode(1, component.languages[1]);

    expect(first).toBe('es');
    expect(second).toBe('en');
    expect(first).not.toBe(second);
  });

  it('exposes accessible language selector', async () => {
    await setup();

    const label = screen.getByLabelText(/language|idioma/i);
    expect(label).toBeTruthy();
  });
});
