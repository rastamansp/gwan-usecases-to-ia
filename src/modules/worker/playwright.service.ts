import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

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

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicializa o navegador Playwright
   */
  public async initializeBrowser(): Promise<void> {
    try {
      this.logger.log('Iniciando navegador Playwright...');
      
      const browserPath = this.configService.get<string>('PLAYWRIGHT_BROWSER_PATH');
      const headless = this.configService.get<string>('PLAYWRIGHT_HEADLESS', 'true') === 'true';
      const timeout = this.configService.get<number>('PLAYWRIGHT_TIMEOUT', 30000);

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

      // Só usar executablePath se foi especificado
      if (browserPath) {
        launchOptions.executablePath = browserPath;
      }

      this.browser = await chromium.launch(launchOptions);

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
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
      
      // Capturar screenshot da página de resultados
      await page.screenshot({ path: `search-results-${Date.now()}.png`, fullPage: true });
      this.logger.log('📸 Screenshot da página de resultados salvo');
      
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
      this.logger.log('🔍 Iniciando extração de resultados de produtos...');
      
      // Aguardar carregamento dos resultados
      await page.waitForTimeout(8000);
      
      // Capturar screenshot dos resultados para debug
      const timestamp = Date.now();
      await page.screenshot({ 
        path: `search-results-${timestamp}.png`, 
        fullPage: false 
      });
      this.logger.log(`📸 Screenshot dos resultados salvo: search-results-${timestamp}.png`);
      
      // Log da estrutura da página para debug
      const pageTitle = await page.title();
      const pageUrl = page.url();
      this.logger.log(`📄 Página atual: ${pageTitle}`);
      this.logger.log(`🔗 URL: ${pageUrl}`);
      
      // Usar o seletor correto do Mercado Livre
      this.logger.log('🔍 Procurando produtos com seletor correto...');
      
      const productElements = await page.$$('.ui-search-result__wrapper');
      this.logger.log(`📦 Encontrados ${productElements.length} produtos`);
      
      if (productElements.length === 0) {
        this.logger.warn('Nenhum produto encontrado');
        return [];
      }
      
      // Selecionar apenas o primeiro produto para teste
      const firstProduct = productElements[0];
      this.logger.log('🎯 Selecionando primeiro produto para teste');
      
      // Extrair dados do primeiro produto
      const product = await this.extractProductData(firstProduct);
      
      if (product) {
        this.logger.log('✅ Primeiro produto extraído com sucesso');
        return [product];
      } else {
        this.logger.warn('❌ Falha ao extrair dados do primeiro produto');
        return [];
      }
      
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
      // Extrair título - usar o seletor correto do Mercado Livre
      let title = 'Título não disponível';
      const titleElement = await productElement.$('.poly-component__title');
      if (titleElement) {
        const titleText = await titleElement.textContent();
        if (titleText && titleText.trim()) {
          title = titleText.trim();
          this.logger.log(`✅ Título encontrado: ${title.substring(0, 50)}...`);
        }
      }

      // Extrair preço atual - usar o seletor correto
      let price: number | undefined;
      const priceElement = await productElement.$('.poly-price__current .andes-money-amount__fraction');
      if (priceElement) {
        const priceText = await priceElement.textContent();
        if (priceText) {
          price = this.extractPrice(priceText);
          this.logger.log(`✅ Preço atual encontrado: R$ ${price}`);
        }
      }

      // Extrair preço original (se houver desconto)
      let originalPrice: number | undefined;
      const originalPriceElement = await productElement.$('.andes-money-amount--previous .andes-money-amount__fraction');
      if (originalPriceElement) {
        const originalPriceText = await originalPriceElement.textContent();
        if (originalPriceText) {
          originalPrice = this.extractPrice(originalPriceText);
          this.logger.log(`✅ Preço original encontrado: R$ ${originalPrice}`);
        }
      }

      // Extrair URL do produto - usar o seletor correto
      let productUrl = '';
      const linkElement = await productElement.$('.poly-component__title');
      if (linkElement) {
        const href = await linkElement.getAttribute('href');
        if (href) {
          productUrl = href.startsWith('http') ? href : `https://www.mercadolivre.com.br${href}`;
          this.logger.log(`✅ URL encontrada: ${productUrl.substring(0, 100)}...`);
        }
      }

      // Extrair imagem - usar o seletor correto
      let imageUrl = '';
      const imageElement = await productElement.$('.poly-component__picture');
      if (imageElement) {
        const src = await imageElement.getAttribute('src');
        if (src) {
          imageUrl = src;
          this.logger.log(`✅ Imagem encontrada: ${imageUrl.substring(0, 100)}...`);
        }
      }

      // Extrair informações do vendedor - usar o seletor correto
      let sellerName = '';
      const sellerElement = await productElement.$('.poly-component__seller');
      if (sellerElement) {
        const sellerText = await sellerElement.textContent();
        if (sellerText && sellerText.trim()) {
          sellerName = sellerText.trim();
          this.logger.log(`✅ Vendedor encontrado: ${sellerName}`);
        }
      }

      // Verificar frete grátis - usar o seletor correto
      let freeShipping = false;
      const shippingElement = await productElement.$('.poly-component__shipping');
      if (shippingElement) {
        const shippingText = await shippingElement.textContent();
        if (shippingText && (shippingText.includes('Frete grátis') || shippingText.includes('Grátis'))) {
          freeShipping = true;
          this.logger.log(`✅ Frete grátis detectado`);
        }
      }

      // Calcular desconto
      let discountPercentage: number | undefined;
      if (price && originalPrice && originalPrice > price) {
        discountPercentage = ((originalPrice - price) / originalPrice) * 100;
        this.logger.log(`✅ Desconto calculado: ${discountPercentage.toFixed(1)}%`);
      }

      // Log dos dados extraídos para debug
      this.logger.log('📊 Dados extraídos:', {
        title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
        price,
        originalPrice,
        productUrl: productUrl.substring(0, 100) + (productUrl.length > 100 ? '...' : ''),
        imageUrl: imageUrl.substring(0, 100) + (imageUrl.length > 100 ? '...' : ''),
        sellerName,
        freeShipping,
        discountPercentage
      });

      return {
        title: title.trim(),
        price,
        originalPrice,
        discountPercentage,
        sellerName: sellerName?.trim(),
        freeShipping,
        condition: 'Novo', // Assumir como novo por padrão
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
      // Remover caracteres não numéricos exceto vírgula e ponto
      const cleanPrice = priceText.replace(/[^\d,.]/g, '');
      
      // Converter vírgula para ponto (formato brasileiro)
      const normalizedPrice = cleanPrice.replace(',', '.');
      
      const price = parseFloat(normalizedPrice);
      return isNaN(price) ? undefined : price;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Captura screenshot em caso de erro
   */
  private async captureErrorScreenshot(page: Page, productName: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `error-${productName}-${timestamp}.png`;
      
      await page.screenshot({
        path: `logs/screenshots/${filename}`,
        fullPage: true,
      });
      
      this.logger.log(`Screenshot de erro salvo: ${filename}`);
    } catch (error) {
      this.logger.warn('Erro ao capturar screenshot:', error);
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
      this.logger.log(`🎯 Objetivo: Extrair apenas o primeiro produto encontrado`);
      
      page = await this.context!.newPage();
      
      // Configurar timeout da página
      page.setDefaultTimeout(60000); // Aumentar para 60 segundos
      
      // Acessar Mercado Livre
      await this.navigateToMercadoLivre(page);
      
      // Executar busca
      await this.performSearch(page, productName);
      
      // Extrair apenas o primeiro resultado
      const results = await this.extractProductResults(page, 1);
      
      if (results.length > 0) {
        this.logger.log(`🎉 Teste concluído com sucesso! Primeiro produto extraído:`);
        this.logger.log(`   Nome: ${results[0].title}`);
        this.logger.log(`   Preço: R$ ${results[0].price}`);
        this.logger.log(`   URL: ${results[0].productUrl}`);
      } else {
        this.logger.log(`⚠️ Teste concluído, mas nenhum produto foi extraído`);
      }
      
      return results;
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
      await page.screenshot({ path: `test-navigation-${Date.now()}.png`, fullPage: true });
      this.logger.log('📸 Screenshot da página salvo');
      
      return {
        success: true,
        message: 'Navegação básica funcionando',
        pageTitle,
        pageSize: pageContent.length,
        searchInputFound: !!searchInput,
        timestamp: new Date().toISOString()
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
}
