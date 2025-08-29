import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from '../../config/app.config';

export interface ProductSearchData {
  searchId: string;
  productName: string;
  maxResults: number;
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface ProductResult {
  productId?: string;
  title: string;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  sellerName?: string;
  sellerRating?: number;
  freeShipping: boolean;
  condition?: string;
  imageUrl?: string;
  productUrl?: string;
}

@Injectable()
export class PlaywrightService {
  private readonly logger = new Logger(PlaywrightService.name);
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly appConfig: AppConfig,
  ) {}

  /**
   * Inicializa o navegador Playwright
   */
  public async initializeBrowser(): Promise<void> {
    try {
      this.logger.log('Iniciando navegador Playwright...');

      const browserPath = this.appConfig.playwrightBrowserPath;
      const headless = this.appConfig.playwrightHeadless;
      const timeout = this.appConfig.playwrightTimeout;

      this.logger.log(`🔧 Configuração Playwright: browserPath=${browserPath}, headless=${headless}, timeout=${timeout}`);

      const launchOptions: any = {
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      };

      // Só usar executablePath se foi especificado E não estivermos no Windows
      // No Windows, deixar o Playwright usar o navegador instalado automaticamente
      if (browserPath && process.platform !== 'win32') {
        launchOptions.executablePath = browserPath;
        this.logger.log(`Usando caminho personalizado do navegador: ${browserPath}`);
      } else {
        this.logger.log(
          'Usando navegador padrão do Playwright (Windows ou sem caminho específico)',
        );
      }

      this.browser = await chromium.launch(launchOptions);

      this.context = await this.browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      this.logger.log('Navegador Playwright inicializado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao inicializar navegador Playwright', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao inicializar navegador: ${errorMessage}`);
    }
  }

  /**
   * Executa a busca de produtos no Mercado Livre
   */
  public async searchProducts(searchData: ProductSearchData): Promise<ProductResult[]> {
    let page: Page | null = null;

    try {
      if (!this.context) {
        await this.initializeBrowser();
      }

      this.logger.log(`Iniciando busca por: ${searchData.productName}`);

      page = await this.context!.newPage();

      // Configurar timeout da página
      page.setDefaultTimeout(60000); // Aumentar para 60 segundos

      // Acessar Mercado Livre
      await this.navigateToMercadoLivre(page);

      // Executar busca
      await this.performSearch(page, searchData.productName);

      // Extrair resultados
      const results = await this.extractProductResults(page, searchData.maxResults);

      this.logger.log(`Busca concluída. ${results.length} produtos encontrados`);

      return results;
    } catch (error) {
      this.logger.error(`Erro durante busca de produtos: ${searchData.productName}`, error);

      // Capturar screenshot em caso de erro
      if (page) {
        await this.captureErrorScreenshot(page, searchData.productName);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha na busca de produtos: ${errorMessage}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Navega para o Mercado Livre
   */
  private async navigateToMercadoLivre(page: Page): Promise<void> {
    try {
      this.logger.log('Navegando para Mercado Livre...');

      // Usar domcontentloaded ao invés de networkidle para ser mais rápido
      await page.goto('https://www.mercadolivre.com.br/', {
        waitUntil: 'domcontentloaded',
        timeout: 45000, // Aumentar timeout para 45 segundos
      });

      // Aguardar carregamento da página com timeout maior
      await page.waitForSelector('input[name="as_word"]', { timeout: 20000 });

      // Aguardar um pouco para garantir que a página esteja totalmente carregada
      await page.waitForTimeout(2000);

      // Tentar aceitar cookies se aparecer
      try {
        const acceptCookiesButton = await page.$('button[data-testid="action:understood-button"]');
        if (acceptCookiesButton) {
          await acceptCookiesButton.click();
          this.logger.log('Cookies aceitos');
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        this.logger.log('Nenhum banner de cookies encontrado ou já aceito');
      }

      this.logger.log('Mercado Livre carregado com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao navegar para Mercado Livre: ${errorMessage}`);
    }
  }

  /**
   * Executa a busca pelo produto
   */
  private async performSearch(page: Page, productName: string): Promise<void> {
    try {
      this.logger.log(`Executando busca por: ${productName}`);

      // Localizar e preencher campo de busca
      const searchInput = await page.waitForSelector('input[name="as_word"]', { timeout: 20000 });
      await searchInput.fill(productName);

      // Aguardar um pouco para o preenchimento
      await page.waitForTimeout(1000);

      // Clicar no botão de busca
      const searchButton = await page.waitForSelector('button[type="submit"]', { timeout: 20000 });
      await searchButton.click();

      // Aguardar carregamento dos resultados com estratégia mais simples
      this.logger.log('Aguardando carregamento dos resultados...');

      // Aguardar um tempo fixo para a página carregar
      await page.waitForTimeout(8000);

      // Verificar se há algum conteúdo na página
      const pageContent = await page.content();
      this.logger.log(`📄 Tamanho da página após busca: ${pageContent.length} caracteres`);

      // Verificar título da página
      const pageTitle = await page.title();
      this.logger.log(`📋 Título da página após busca: ${pageTitle}`);

      // Verificar URL atual
      const currentUrl = page.url();
      this.logger.log(`🔗 URL atual: ${currentUrl}`);

      // Verificar se foi redirecionado para página de verificação
      if (currentUrl.includes('account-verification') || currentUrl.includes('verification')) {
        this.logger.warn('⚠️ Mercado Livre redirecionou para página de verificação de conta');
        this.logger.warn('🔍 Isso pode indicar que o IP está sendo bloqueado ou precisa de verificação');
        
        // Tentar voltar para a página principal
        try {
          await page.goto('https://www.mercadolivre.com.br/', { waitUntil: 'domcontentloaded' });
          this.logger.log('🔄 Tentando voltar para página principal...');
          await page.waitForTimeout(3000);
        } catch (navigationError) {
          this.logger.error('❌ Erro ao tentar voltar para página principal:', navigationError);
        }
      }

      // Capturar screenshot da página de resultados
      const timestamp = Date.now();
      const screenshotFilename = `search-results-${timestamp}.png`;
      const screenshotPath = await this.captureScreenshot(page, screenshotFilename, true);

      if (screenshotPath) {
        this.logger.log(`✅ Screenshot da página de resultados salvo: ${screenshotPath}`);
      } else {
        this.logger.warn('⚠️ Falha ao capturar screenshot da página de resultados');
      }

      this.logger.log('Busca executada com sucesso');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao executar busca: ${errorMessage}`);
    }
  }

  /**
   * Extrai resultados de produtos da página
   */
  private async extractProductResults(page: Page, maxResults: number): Promise<ProductResult[]> {
    try {
      this.logger.log(`🔍 Iniciando extração de resultados de produtos (máximo: ${maxResults})...`);

      // Aguardar carregamento dos resultados
      await page.waitForTimeout(8000);

      // Capturar screenshot dos resultados para debug
      const timestamp = Date.now();
      const screenshotFilename = `search-results-${timestamp}.png`;
      const screenshotPath = await this.captureScreenshot(page, screenshotFilename, false);

      if (screenshotPath) {
        this.logger.log(`✅ Screenshot dos resultados salvo: ${screenshotPath}`);
      } else {
        this.logger.warn('⚠️ Falha ao capturar screenshot dos resultados');
      }

      // Log da estrutura da página para debug
      const pageTitle = await page.title();
      const pageUrl = page.url();
      this.logger.log(`📄 Página atual: ${pageTitle}`);
      this.logger.log(`🔗 URL: ${pageUrl}`);

      // Verificar se foi redirecionado para página de verificação
      if (pageUrl.includes('account-verification') || pageUrl.includes('verification')) {
        this.logger.warn('⚠️ Mercado Livre redirecionou para página de verificação durante extração');
        this.logger.warn('🔍 Não será possível extrair produtos desta página');
        return [];
      }

      // Tentar múltiplos seletores para encontrar produtos
      this.logger.log('🔍 Procurando produtos com múltiplos seletores...');

      let productElements: any[] = [];

      // Seletor principal baseado no HTML fornecido - lista ordenada de resultados
      productElements = await page.$$('ol.ui-search-layout li.ui-search-layout__item');
      this.logger.log(
        `📦 Seletor principal (ol.ui-search-layout li.ui-search-layout__item): ${productElements.length} produtos`,
      );

      // Se não encontrou, tentar seletor mais específico
      if (productElements.length === 0) {
        productElements = await page.$$('ol.ui-search-layout--stack li.ui-search-layout__item');
        this.logger.log(
          `📦 Seletor específico (ol.ui-search-layout--stack li.ui-search-layout__item): ${productElements.length} produtos`,
        );
      }

      // Se não encontrou, tentar seletor alternativo
      if (productElements.length === 0) {
        productElements = await page.$$('.ui-search-result__wrapper');
        this.logger.log(
          `📦 Seletor alternativo (.ui-search-result__wrapper): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor mais genérico
      if (productElements.length === 0) {
        productElements = await page.$$('.ui-search-result');
        this.logger.log(
          `📦 Seletor genérico (.ui-search-result): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor de itens individuais
      if (productElements.length === 0) {
        productElements = await page.$$('.ui-search-item');
        this.logger.log(
          `📦 Seletor de itens (.ui-search-item): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor mais genérico
      if (productElements.length === 0) {
        productElements = await page.$$('li[class*="search"]');
        this.logger.log(
          `📦 Seletor genérico (li[class*="search"]): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor de qualquer item da lista
      if (productElements.length === 0) {
        productElements = await page.$$('ol.ui-search-layout li');
        this.logger.log(
          `📦 Seletor de lista (ol.ui-search-layout li): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor mais genérico de lista
      if (productElements.length === 0) {
        productElements = await page.$$('ol li');
        this.logger.log(`📦 Seletor genérico de lista (ol li): ${productElements.length} produtos`);
      }

      if (productElements.length === 0) {
        this.logger.warn('❌ Nenhum produto encontrado com nenhum seletor');

        // Log da estrutura da página para debug
        const pageContent = await page.content();
        this.logger.log(`📄 Conteúdo da página: ${pageContent.substring(0, 1000)}...`);

        // Tentar encontrar qualquer elemento que possa ser um produto
        const allElements = await page.$$('*');
        this.logger.log(`🔍 Total de elementos na página: ${allElements.length}`);

        // Verificar se há elementos com classes relacionadas a busca
        const searchElements = await page.$$('[class*="search"]');
        this.logger.log(`🔍 Elementos com "search" na classe: ${searchElements.length}`);

        const layoutElements = await page.$$('[class*="layout"]');
        this.logger.log(`🔍 Elementos com "layout" na classe: ${layoutElements.length}`);

        return [];
      }

      // Determinar quantos produtos extrair
      const productsToExtract = Math.min(maxResults, productElements.length);
      this.logger.log(
        `🎯 Extraindo ${productsToExtract} produtos (solicitado: ${maxResults}, disponível: ${productElements.length})`,
      );

      const results: ProductResult[] = [];

      // Extrair dados dos produtos
      for (let i = 0; i < productsToExtract; i++) {
        try {
          this.logger.log(`📦 Processando produto ${i + 1}/${productsToExtract}...`);

          const productElement = productElements[i];
          const product = await this.extractProductData(productElement);

          if (product) {
            results.push(product);
            this.logger.log(
              `✅ Produto ${i + 1} extraído com sucesso: ${product.title.substring(0, 50)}...`,
            );
          } else {
            this.logger.warn(`⚠️ Falha ao extrair dados do produto ${i + 1}`);
          }
        } catch (error) {
          this.logger.error(`❌ Erro ao processar produto ${i + 1}:`, error);
          // Continuar com o próximo produto
        }
      }

      this.logger.log(`🎉 Extração concluída: ${results.length} produtos extraídos com sucesso`);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha ao extrair resultados: ${errorMessage}`);
    }
  }

  /**
   * Extrai dados de um produto individual
   */
  private async extractProductData(productElement: any): Promise<ProductResult | null> {
    try {
      // Extrair título - usar seletor correto baseado no HTML
      let title = 'Título não disponível';
      let titleElement = await productElement.$('.ui-search-item__title');

      if (!titleElement) {
        titleElement = await productElement.$('.poly-component__title');
      }

      if (!titleElement) {
        titleElement = await productElement.$('h2');
      }

      if (!titleElement) {
        titleElement = await productElement.$('a[title]');
      }

      if (titleElement) {
        const titleText = await titleElement.textContent();
        if (titleText && titleText.trim()) {
          title = titleText.trim();
          this.logger.log(`✅ Título encontrado: ${title.substring(0, 50)}...`);
        }
      }

      // Extrair preço atual - usar seletor correto baseado no HTML
      let price: number | undefined;
      let priceElement = await productElement.$('.andes-money-amount__fraction');

      if (!priceElement) {
        priceElement = await productElement.$('.poly-price__current .andes-money-amount__fraction');
      }

      if (!priceElement) {
        priceElement = await productElement.$('[data-testid="price"]');
      }

      if (!priceElement) {
        priceElement = await productElement.$('.ui-search-price__part');
      }

      if (priceElement) {
        const priceText = await priceElement.textContent();
        if (priceText) {
          price = this.extractPrice(priceText);
          this.logger.log(`✅ Preço atual encontrado: R$ ${price}`);
        }
      }

      // Extrair preço original (se houver desconto) - usar seletor correto baseado no HTML
      let originalPrice: number | undefined;
      let originalPriceElement = await productElement.$(
        '.andes-money-amount--previous .andes-money-amount__fraction',
      );

      if (!originalPriceElement) {
        originalPriceElement = await productElement.$('.andes-money-amount--previous');
      }

      if (!originalPriceElement) {
        originalPriceElement = await productElement.$('.ui-search-price__part--old');
      }

      if (originalPriceElement) {
        const originalPriceText = await originalPriceElement.textContent();
        if (originalPriceText) {
          originalPrice = this.extractPrice(originalPriceText);
          this.logger.log(`✅ Preço original encontrado: R$ ${originalPrice}`);
        }
      }

      // Extrair desconto diretamente do texto se disponível
      let discountPercentage: number | undefined;
      let discountElement = await productElement.$('.ui-search-price__discount');

      if (!discountElement) {
        discountElement = await productElement.$('.andes-money-amount__discount');
      }

      if (discountElement) {
        const discountText = await discountElement.textContent();
        if (discountText) {
          // Extrair número do texto (ex: "11% OFF" -> 11)
          const discountMatch = discountText.match(/(\d+)%/);
          if (discountMatch) {
            discountPercentage = parseFloat(discountMatch[1]);
            this.logger.log(`✅ Desconto encontrado: ${discountPercentage}%`);
          }
        }
      }

      // Se não encontrou desconto direto, calcular baseado nos preços
      if (!discountPercentage && price && originalPrice && originalPrice > price) {
        discountPercentage = ((originalPrice - price) / originalPrice) * 100;
        this.logger.log(`✅ Desconto calculado: ${discountPercentage.toFixed(1)}%`);
      }

      // Extrair URL do produto - usar seletor correto baseado no HTML
      let productUrl = '';
      let linkElement = await productElement.$('.ui-search-item__title');

      if (!linkElement) {
        linkElement = await productElement.$('.poly-component__title');
      }

      if (!linkElement) {
        linkElement = await productElement.$('a[href]');
      }

      if (linkElement) {
        const href = await linkElement.getAttribute('href');
        if (href) {
          productUrl = href.startsWith('http') ? href : `https://www.mercadolivre.com.br${href}`;
          this.logger.log(`✅ URL encontrada: ${productUrl.substring(0, 100)}...`);
        }
      }

      // Extrair imagem - usar seletor correto baseado no HTML
      let imageUrl = '';
      let imageElement = await productElement.$('.ui-search-result-image__element');

      if (!imageElement) {
        imageElement = await productElement.$('.poly-component__picture');
      }

      if (!imageElement) {
        imageElement = await productElement.$('img[src]');
      }

      if (imageElement) {
        // Priorizar data-src se src for base64 placeholder
        let src = await imageElement.getAttribute('data-src');
        if (!src || src.includes('data:image/gif;base64')) {
          src = await imageElement.getAttribute('src');
        }

        if (src && !src.includes('data:image/gif;base64')) {
          imageUrl = src;
          this.logger.log(`✅ Imagem encontrada: ${imageUrl.substring(0, 100)}...`);
        }
      }

      // Extrair informações do vendedor - usar seletor correto baseado no HTML
      let sellerName = '';
      let sellerElement = await productElement.$('.ui-search-item__seller');

      if (!sellerElement) {
        sellerElement = await productElement.$('.poly-component__seller');
      }

      if (!sellerElement) {
        sellerElement = await productElement.$('.ui-search-item__seller-info');
      }

      if (sellerElement) {
        const sellerText = await sellerElement.textContent();
        if (sellerText && sellerText.trim()) {
          // Remover prefixo "Por " se existir
          sellerName = sellerText.trim().replace(/^Por\s+/, '');
          this.logger.log(`✅ Vendedor encontrado: ${sellerName}`);
        }
      }

      // Extrair avaliação do vendedor
      let sellerRating: number | undefined;
      let ratingElement = await productElement.$('.poly-reviews__rating');

      if (!ratingElement) {
        ratingElement = await productElement.$('.ui-search-item__rating');
      }

      if (ratingElement) {
        const ratingText = await ratingElement.textContent();
        if (ratingText) {
          // Extrair número do texto (ex: "5.0" -> 5.0)
          const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
          if (ratingMatch) {
            sellerRating = parseFloat(ratingMatch[1]);
            this.logger.log(`✅ Avaliação do vendedor encontrada: ${sellerRating}`);
          }
        }
      }

      // Verificar frete grátis - usar seletor correto baseado no HTML
      let freeShipping = false;
      let shippingElement = await productElement.$('.ui-search-item__shipping');

      if (!shippingElement) {
        shippingElement = await productElement.$('.poly-component__shipping');
      }

      if (!shippingElement) {
        shippingElement = await productElement.$('.ui-search-item__shipping-info');
      }

      if (shippingElement) {
        const shippingText = await shippingElement.textContent();
        if (
          shippingText &&
          (shippingText.includes('Frete grátis') ||
            shippingText.includes('Grátis') ||
            shippingText.includes('Gratuito'))
        ) {
          freeShipping = true;
          this.logger.log(`✅ Frete grátis detectado`);
        }
      }

      // Extrair condição do produto
      let condition = 'Novo'; // Padrão
      let conditionElement = await productElement.$('.poly-component__item-condition');

      if (!conditionElement) {
        conditionElement = await productElement.$('.ui-search-item__condition');
      }

      if (conditionElement) {
        const conditionText = await conditionElement.textContent();
        if (conditionText && conditionText.trim()) {
          condition = conditionText.trim();
          this.logger.log(`✅ Condição encontrada: ${condition}`);
        }
      }

      // Log dos dados extraídos para debug
      this.logger.log('📊 Dados extraídos:', {
        title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
        price,
        originalPrice,
        discountPercentage,
        productUrl: productUrl.substring(0, 100) + (productUrl.length > 100 ? '...' : ''),
        imageUrl: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
        sellerName,
        sellerRating,
        freeShipping,
        condition,
      });

      return {
        title: title.trim(),
        price,
        originalPrice,
        discountPercentage,
        sellerName: sellerName?.trim(),
        sellerRating,
        freeShipping,
        condition,
        imageUrl,
        productUrl,
      };
    } catch (error) {
      this.logger.warn('Erro ao extrair dados do produto:', error);
      return null;
    }
  }

  /**
   * Extrai preço do texto
   */
  private extractPrice(priceText: string): number | undefined {
    if (!priceText) return undefined;

    try {
      this.logger.debug(`🔍 Extraindo preço de: "${priceText}"`);

      // Remover caracteres não numéricos exceto vírgula, ponto e R$
      let cleanPrice = priceText.replace(/[^\d,.]/g, '');

      // Se não há números, retornar undefined
      if (!cleanPrice || cleanPrice === '') {
        this.logger.debug(`❌ Nenhum número encontrado em: "${priceText}"`);
        return undefined;
      }

      // Formato brasileiro: ponto é separador de milhares, vírgula é separador decimal
      // Exemplos: "9.500" -> 9500, "19.477,73" -> 19477.73, "477,73" -> 477.73
      if (cleanPrice.includes(',')) {
        // Se tem vírgula, é separador decimal
        if (cleanPrice.includes('.')) {
          // Exemplo: "19.477,73" -> "19477.73"
          cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
        } else {
          // Exemplo: "477,73" -> "477.73"
          cleanPrice = cleanPrice.replace(',', '.');
        }
      } else if (cleanPrice.includes('.')) {
        // Se só tem ponto e não tem vírgula, verificar se é separador de milhares
        // Exemplo: "9.500" -> "9500"
        // Se o número após o ponto tem 3 dígitos, provavelmente é separador de milhares
        const parts = cleanPrice.split('.');
        if (parts.length === 2 && parts[1].length === 3) {
          // Provavelmente separador de milhares: "9.500" -> "9500"
          cleanPrice = cleanPrice.replace('.', '');
        }
        // Se não, manter como está (pode ser decimal como "9.50")
      }

      // Verificar se é um número válido
      const price = parseFloat(cleanPrice);

      if (isNaN(price) || price <= 0) {
        this.logger.debug(`❌ Preço inválido após conversão: ${price} de "${priceText}"`);
        return undefined;
      }

      // Log para debug
      this.logger.debug(`✅ Preço extraído: "${priceText}" -> ${price}`);

      return price;
    } catch (error) {
      this.logger.warn(`❌ Erro ao extrair preço de "${priceText}":`, error);
      return undefined;
    }
  }

  /**
   * Captura screenshot em caso de erro
   */
  private async captureErrorScreenshot(page: Page, productName: string): Promise<void> {
    try {
      this.logger.log(`🔍 Tentando capturar screenshot de erro para: ${productName}`);

      // Verificar se a página ainda está válida
      if (!page || page.isClosed()) {
        this.logger.warn('❌ Página não está disponível para screenshot');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `error-${productName}-${timestamp}.png`;

      const screenshotPath = await this.captureScreenshot(page, filename, true);

      if (screenshotPath) {
        this.logger.log(`✅ Screenshot de erro salvo com sucesso: ${screenshotPath}`);
      } else {
        this.logger.warn('⚠️ Falha ao capturar screenshot de erro');
      }
    } catch (error) {
      this.logger.error('❌ Erro ao capturar screenshot:', error);
      this.logger.error(`Stack trace: ${error instanceof Error ? error.stack : 'N/A'}`);
    }
  }

  /**
   * Executa uma busca de teste diretamente (para debugging)
   */
  public async executeTestSearch(productName: string, maxResults: number = 1): Promise<any> {
    let page: Page | null = null;

    try {
      if (!this.context) {
        await this.initializeBrowser();
      }

      this.logger.log(`Iniciando busca de teste por: ${productName}`);
      this.logger.log(`🎯 Objetivo: Extrair até ${maxResults} produtos encontrados`);

      page = await this.context!.newPage();

      // Configurar timeout da página
      page.setDefaultTimeout(60000); // Aumentar para 60 segundos

      // Acessar Mercado Livre
      await this.navigateToMercadoLivre(page);

      // Executar busca
      await this.performSearch(page, productName);

      // Aguardar carregamento dos resultados
      await page.waitForTimeout(8000);

      // Capturar screenshot da página completa
      const timestamp = Date.now();

      const screenshotFilename = `test-search-results-${timestamp}.png`;
      const screenshotPath = await this.captureScreenshot(page, screenshotFilename, true);

      if (screenshotPath) {
        this.logger.log(`✅ Screenshot completo salvo: ${screenshotPath}`);
      } else {
        this.logger.warn('⚠️ Falha ao capturar screenshot completo');
      }

      // Log da estrutura da página para debug
      const pageTitle = await page.title();
      const pageUrl = page.url();
      this.logger.log(`📄 Página atual: ${pageTitle}`);
      this.logger.log(`🔗 URL: ${pageUrl}`);

      // Verificar se há algum conteúdo na página
      const pageContent = await page.content();
      this.logger.log(`📄 Tamanho da página: ${pageContent.length} caracteres`);

      // Tentar múltiplos seletores para encontrar produtos
      this.logger.log('🔍 Procurando produtos com múltiplos seletores...');

      let productElements: any[] = [];

      // Seletor principal baseado no HTML fornecido - lista ordenada de resultados
      productElements = await page.$$('ol.ui-search-layout li.ui-search-layout__item');
      this.logger.log(
        `📦 Seletor principal (ol.ui-search-layout li.ui-search-layout__item): ${productElements.length} produtos`,
      );

      // Se não encontrou, tentar seletor mais específico
      if (productElements.length === 0) {
        productElements = await page.$$('ol.ui-search-layout--stack li.ui-search-layout__item');
        this.logger.log(
          `📦 Seletor específico (ol.ui-search-layout--stack li.ui-search-layout__item): ${productElements.length} produtos`,
        );
      }

      // Se não encontrou, tentar seletor alternativo
      if (productElements.length === 0) {
        productElements = await page.$$('.ui-search-result__wrapper');
        this.logger.log(
          `📦 Seletor alternativo (.ui-search-result__wrapper): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor mais genérico
      if (productElements.length === 0) {
        productElements = await page.$$('.ui-search-result');
        this.logger.log(
          `📦 Seletor genérico (.ui-search-result): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor de itens individuais
      if (productElements.length === 0) {
        productElements = await page.$$('.ui-search-item');
        this.logger.log(
          `📦 Seletor de itens (.ui-search-item): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor mais genérico
      if (productElements.length === 0) {
        productElements = await page.$$('li[class*="search"]');
        this.logger.log(
          `📦 Seletor genérico (li[class*="search"]): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor de qualquer item da lista
      if (productElements.length === 0) {
        productElements = await page.$$('ol.ui-search-layout li');
        this.logger.log(
          `📦 Seletor de lista (ol.ui-search-layout li): ${productElements.length} produtos`,
        );
      }

      // Se ainda não encontrou, tentar seletor mais genérico de lista
      if (productElements.length === 0) {
        productElements = await page.$$('ol li');
        this.logger.log(`📦 Seletor genérico de lista (ol li): ${productElements.length} produtos`);
      }

      if (productElements.length === 0) {
        this.logger.warn('❌ Nenhum produto encontrado com nenhum seletor');

        // Log da estrutura da página para debug
        const pageContent = await page.content();
        this.logger.log(`📄 Conteúdo da página: ${pageContent.substring(0, 1000)}...`);

        // Tentar encontrar qualquer elemento que possa ser um produto
        const allElements = await page.$$('*');
        this.logger.log(`🔍 Total de elementos na página: ${allElements.length}`);

        // Verificar se há elementos com classes relacionadas a busca
        const searchElements = await page.$$('[class*="search"]');
        this.logger.log(`🔍 Elementos com "search" na classe: ${searchElements.length}`);

        const layoutElements = await page.$$('[class*="layout"]');
        this.logger.log(`🔍 Elementos com "layout" na classe: ${layoutElements.length}`);

        return {
          success: false,
          message: 'Nenhum produto encontrado',
          debug: {
            pageTitle,
            pageUrl,
            pageSize: pageContent.length,
            totalElements: allElements.length,
            searchElements: searchElements.length,
            layoutElements: layoutElements.length,
          },
        };
      }

      // Determinar quantos produtos extrair
      const productsToExtract = Math.min(maxResults, productElements.length);
      this.logger.log(
        `🎯 Extraindo ${productsToExtract} produtos (solicitado: ${maxResults}, disponível: ${productElements.length})`,
      );

      const results: ProductResult[] = [];

      // Extrair dados dos produtos
      for (let i = 0; i < productsToExtract; i++) {
        try {
          this.logger.log(`📦 Processando produto ${i + 1}/${productsToExtract}...`);

          const productElement = productElements[i];
          const product = await this.extractProductData(productElement);

          if (product) {
            results.push(product);
            this.logger.log(
              `✅ Produto ${i + 1} extraído com sucesso: ${product.title.substring(0, 50)}...`,
            );
          } else {
            this.logger.warn(`⚠️ Falha ao extrair dados do produto ${i + 1}`);
          }
        } catch (error) {
          this.logger.error(`❌ Erro ao processar produto ${i + 1}:`, error);
          // Continuar com o próximo produto
        }
      }

      this.logger.log(`🎉 Teste concluído: ${results.length} produtos extraídos com sucesso`);

      return {
        success: true,
        totalFound: productElements.length,
        totalExtracted: results.length,
        requested: maxResults,
        results,
        debug: {
          pageTitle,
          pageUrl,
          pageSize: pageContent.length,
          productElementsFound: productElements.length,
        },
      };
    } catch (error) {
      this.logger.error(`❌ Erro durante busca de teste: ${productName}`, error);

      // Capturar screenshot em caso de erro
      if (page) {
        await this.captureErrorScreenshot(page, productName);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha na busca de teste: ${errorMessage}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Método de teste simplificado para verificar navegação básica
   */
  public async testBasicNavigation(): Promise<any> {
    let page: Page | null = null;

    try {
      if (!this.context) {
        await this.initializeBrowser();
      }

      this.logger.log('Iniciando teste de navegação básica...');

      page = await this.context!.newPage();

      // Configurar timeout da página
      page.setDefaultTimeout(60000);

      // Navegar para o Mercado Livre
      this.logger.log('Navegando para Mercado Livre...');
      await page.goto('https://www.mercadolivre.com.br/', {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      // Verificar se a página carregou
      this.logger.log('Verificando elementos básicos da página...');

      // Verificar campo de busca
      const searchInput = await page.waitForSelector('input[name="as_word"]', { timeout: 20000 });
      this.logger.log('✅ Campo de busca encontrado');

      // Verificar se há algum conteúdo na página
      const pageContent = await page.content();
      this.logger.log(`📄 Tamanho da página: ${pageContent.length} caracteres`);

      // Verificar título da página
      const pageTitle = await page.title();
      this.logger.log(`📋 Título da página: ${pageTitle}`);

      // Tentar aceitar cookies se aparecer
      try {
        const acceptCookiesButton = await page.$('button[data-testid="action:understood-button"]');
        if (acceptCookiesButton) {
          await acceptCookiesButton.click();
          this.logger.log('🍪 Cookies aceitos');
          await page.waitForTimeout(1000);
        }
      } catch (error) {
        this.logger.log('ℹ️ Nenhum banner de cookies encontrado ou já aceito');
      }

      // Capturar screenshot da página
      const timestamp = Date.now();
      const screenshotFilename = `test-navigation-${timestamp}.png`;
      const screenshotPath = await this.captureScreenshot(page, screenshotFilename, true);

      if (screenshotPath) {
        this.logger.log(`✅ Screenshot da página salvo: ${screenshotPath}`);
      } else {
        this.logger.warn('⚠️ Falha ao capturar screenshot da página');
      }

      return {
        success: true,
        message: 'Navegação básica funcionando',
        pageTitle,
        pageSize: pageContent.length,
        searchInputFound: !!searchInput,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Erro durante teste de navegação básica:', error);

      // Capturar screenshot em caso de erro
      if (page) {
        await this.captureErrorScreenshot(page, 'navigation-test');
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Falha no teste de navegação básica: ${errorMessage}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Fecha o navegador
   */
  public async closeBrowser(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.logger.log('Navegador Playwright fechado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao fechar navegador:', error);
    }
  }

  /**
   * Verifica se o navegador está ativo
   */
  public isBrowserActive(): boolean {
    return this.browser !== null && this.context !== null;
  }

  /**
   * Garante que a pasta de screenshots exista
   */
  private ensureScreenshotsDirectory(): string {
    // Em produção, usar pasta que o container pode acessar
    const screenshotsDir = process.env.NODE_ENV === 'production' 
      ? '/app/logs/screenshots'
      : path.join(process.cwd(), 'logs', 'screenshots');

    try {
      if (!fs.existsSync(screenshotsDir)) {
        this.logger.log(`📁 Criando pasta de screenshots: ${screenshotsDir}`);
        fs.mkdirSync(screenshotsDir, { recursive: true });
      }

      return screenshotsDir;
    } catch (error) {
      this.logger.error('❌ Erro ao criar pasta de screenshots:', error);
      
      // Fallback para pasta que o container pode acessar
      const fallbackDir = process.env.NODE_ENV === 'production'
        ? '/tmp/screenshots'
        : path.join(process.cwd(), 'temp-screenshots');
      
      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        this.logger.log(`📁 Usando pasta fallback: ${fallbackDir}`);
        return fallbackDir;
      } catch (fallbackError) {
        this.logger.error('❌ Erro ao criar pasta fallback:', fallbackError);
        // Último recurso: usar pasta temporária do sistema
        return '/tmp';
      }
    }
  }

  /**
   * Captura screenshot com tratamento de erro robusto
   */
  private async captureScreenshot(
    page: Page,
    filename: string,
    fullPage: boolean = true,
  ): Promise<string | null> {
    try {
      // Garantir que a pasta existe
      const screenshotsDir = this.ensureScreenshotsDirectory();
      const fullPath = path.join(screenshotsDir, filename);

      this.logger.log(`📸 Tentando capturar screenshot em: ${fullPath}`);

      await page.screenshot({
        path: fullPath,
        fullPage,
      });

      // Verificar se o arquivo foi realmente criado
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        this.logger.log(`✅ Screenshot criado com sucesso: ${fullPath} (${stats.size} bytes)`);
        return fullPath;
      } else {
        this.logger.error(`❌ Screenshot não foi criado: ${fullPath}`);
        return null;
      }
    } catch (error) {
      this.logger.error('❌ Erro ao capturar screenshot:', error);
      this.logger.error(`Stack trace: ${error instanceof Error ? error.stack : 'N/A'}`);
      return null;
    }
  }
}
