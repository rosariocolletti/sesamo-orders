export type Language = 'en' | 'cs';

export const tourSteps = {
  en: [
    {
      target: 'body',
      content: 'Welcome to the Order Management System! Let me show you around.',
      placement: 'center' as const,
    },
    {
      target: '[data-tour="tab-orders"]',
      content: 'This is the Orders tab. Here you can view, create, and manage all your orders.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-clients"]',
      content: 'The Clients tab lets you manage all your clients, their contact information, and order history.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-items"]',
      content: 'The Items tab (CAT) is your product catalog. Here you can add, edit, and remove items.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-merge"]',
      content: 'The Merge tab (X) allows you to combine multiple pending orders for efficient delivery.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-reports"]',
      content: 'The Reports tab (RPT) provides analytics and insights about your orders and clients.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="help-button"]',
      content: 'Click here anytime to restart this tour or switch languages.',
      placement: 'left' as const,
    },
    {
      target: 'body',
      content: 'That\'s the basics! Start by exploring the Orders tab to get familiar with the system.',
      placement: 'center' as const,
    },
  ],
  cs: [
    {
      target: 'body',
      content: 'Vítejte v systému správy objednávek! Pojďme si zde projít.',
      placement: 'center' as const,
    },
    {
      target: '[data-tour="tab-orders"]',
      content: 'Toto je záložka Objednávky. Zde můžete zobrazit, vytvořit a spravovat všechny své objednávky.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-clients"]',
      content: 'Záložka Klienti vám umožní spravovat všechny své klienty, jejich kontaktní údaje a historii objednávek.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-items"]',
      content: 'Záložka Položky (CAT) je váš katalog produktů. Zde můžete přidávat, upravovat a odstraňovat položky.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-merge"]',
      content: 'Záložka Sloučit (X) vám umožní kombinovat více nevyřízených objednávek pro efektivní doručení.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="tab-reports"]',
      content: 'Záložka Zprávy (RPT) poskytuje analýzy a přehledy o vašich objednávkách a klientech.',
      placement: 'bottom' as const,
    },
    {
      target: '[data-tour="help-button"]',
      content: 'Klikněte zde kdykoliv, abyste restartovali tuto prohlídku nebo si vybrali jazyk.',
      placement: 'left' as const,
    },
    {
      target: 'body',
      content: 'To jsou základy! Začněte průzkumem záložky Objednávky, abyste se s tímto systémem seznámili.',
      placement: 'center' as const,
    },
  ],
};
