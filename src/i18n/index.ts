/**
 * CodeBuddy CN Agent 国际化支持模块
 * 提供多语言文本管理和语言切换功能
 */

export type SupportedLanguage = 'en' | 'zh-CN' | 'ja' | 'ko';

export interface I18nConfig {
  language: SupportedLanguage;
  locale: string;
  fallbackLanguage: SupportedLanguage;
}

export interface I18nMessages {
  [key: string]: string | I18nMessages;
}

/**
 * 国际化管理器
 * 负责语言配置、文本翻译和语言切换
 */
export class I18nManager {
  private static instance: I18nManager;
  private currentLanguage: SupportedLanguage;
  private currentLocale: string;
  private fallbackLanguage: SupportedLanguage;
  private messages: Map<SupportedLanguage, I18nMessages> = new Map();

  private constructor() {
    // 默认配置
    this.currentLanguage = 'zh-CN';
    this.currentLocale = 'zh-CN';
    this.fallbackLanguage = 'en';
    this.initializeMessages();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * 初始化多语言文本
   */
  private initializeMessages(): void {
    // 英文文本
    this.messages.set('en', {
      common: {
        success: 'Success',
        failed: 'Failed',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
        start: 'Start',
        complete: 'Complete',
        loading: 'Loading...',
        processing: 'Processing...',
        waiting: 'Waiting...',
        skip: 'Skip',
        retry: 'Retry',
        cancel: 'Cancel',
        confirm: 'Confirm',
        next: 'Next',
        previous: 'Previous',
        finish: 'Finish'
      },
      paywall: {
        cloudCounterFailed: 'Cloud counter call failed:',
        getCallsFailed: 'Failed to get call count from cloud:',
        cloudCheckFailed: 'Cloud check failed:',
        resetFailed: 'Reset failed:'
      },
      roles: {
        techLead: 'Technical Director',
        productManager: 'Product Manager',
        uiDesigner: 'UI Designer',
        frontendEngineer: 'Frontend Engineer',
        backendEngineer: 'Backend Engineer',
        qaEngineer: 'QA Engineer'
      },
      roleDescriptions: {
        techLead: 'Responsible for technical architecture design and team management',
        productManager: 'Responsible for requirement analysis and product planning',
        uiDesigner: 'Responsible for user interface and experience design',
        frontendEngineer: 'Responsible for frontend development and user interface implementation',
        backendEngineer: 'Responsible for backend development and database design',
        qaEngineer: 'Responsible for testing and quality assurance'
      },
      workflow: {
        steps: {
          requirementAnalysis: 'Requirement Analysis',
          techArchitecture: 'Technical Architecture',
          uiDesign: 'UI Design',
          frontendDev: 'Frontend Development',
          backendDev: 'Backend Development',
          testing: 'Testing',
          deployment: 'Deployment',
          maintenance: 'Maintenance',
          databaseDesign: 'Database Design',
          apiDevelopment: 'API Development',
          businessLogic: 'Business Logic',
          performanceTest: 'Performance Test',
          manualTest: 'Manual Test',
          bugTracking: 'Bug Tracking'
        },
        contents: {
          databaseSchemaDoc: 'Database Schema Documentation',
          apiEndpointsDoc: 'API Endpoints Documentation',
          businessLogicDoc: 'Business Logic Documentation'
        },
        queries: {
          businessLogicPatterns: 'Business Logic Implementation Patterns',
          apiDesignPatterns: 'API Design Best Practices',
          databaseOptimization: 'Database Performance Optimization'
        }
      }
    });

    // 中文文本
    this.messages.set('zh-CN', {
      common: {
        success: '成功',
        failed: '失败',
        error: '错误',
        warning: '警告',
        info: '信息',
        start: '开始',
        complete: '完成',
        loading: '加载中...',
        processing: '处理中...',
        waiting: '等待中...',
        skip: '跳过',
        retry: '重试',
        cancel: '取消',
        confirm: '确认',
        next: '下一步',
        previous: '上一步',
        finish: '完成'
      },
      paywall: {
        cloudCounterFailed: '云端计数器调用失败:',
        getCallsFailed: '云端获取调用次数失败:',
        cloudCheckFailed: '云端检查失败:',
        resetFailed: '重置失败:'
      },
      roles: {
        techLead: '技术总监',
        productManager: '产品经理',
        uiDesigner: 'UI设计师',
        frontendEngineer: '前端工程师',
        backendEngineer: '后端工程师',
        qaEngineer: '测试工程师'
      },
      roleDescriptions: {
        techLead: '负责技术架构设计和团队管理',
        productManager: '负责需求分析和产品规划',
        uiDesigner: '负责用户界面和体验设计',
        frontendEngineer: '负责前端开发和用户界面实现',
        backendEngineer: '负责后端开发和数据库设计',
        qaEngineer: '负责测试和质量保证'
      },
      workflow: {
        steps: {
          requirementAnalysis: '需求分析',
          techArchitecture: '技术架构',
          uiDesign: 'UI设计',
          frontendDev: '前端开发',
          backendDev: '后端开发',
          testing: '测试',
          deployment: '部署',
          maintenance: '维护',
          databaseDesign: '数据库设计',
          apiDevelopment: 'API开发',
          businessLogic: '业务逻辑',
          performanceTest: '性能测试',
          manualTest: '手工测试',
          bugTracking: 'Bug跟踪'
        },
        contents: {
          databaseSchemaDoc: '数据库设计文档',
          apiEndpointsDoc: 'API接口文档',
          businessLogicDoc: '业务逻辑文档'
        },
        queries: {
          businessLogicPatterns: '业务逻辑实现模式',
          apiDesignPatterns: 'API设计最佳实践',
          databaseOptimization: '数据库性能优化'
        }
      }
    });
  }

  /**
   * 设置语言
   */
  public setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
    this.currentLocale = language;
  }

  /**
   * 获取当前语言
   */
  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * 获取翻译文本
   */
  public t(key: string): string {
    const keys = key.split('.');
    let message: any = this.messages.get(this.currentLanguage);
    
    // 递归查找翻译
    for (const k of keys) {
      if (message && typeof message === 'object' && k in message) {
        message = message[k];
      } else {
        // 如果当前语言没有，尝试回退语言
        message = this.messages.get(this.fallbackLanguage);
        for (const k of keys) {
          if (message && typeof message === 'object' && k in message) {
            message = message[k];
          } else {
            return key; // 如果都找不到，返回key本身
          }
        }
        break;
      }
    }
    
    return typeof message === 'string' ? message : key;
  }

  /**
   * 获取所有支持的语言
   */
  public getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.messages.keys());
  }
}

// 导出单例实例和便捷函数
export const i18n = I18nManager.getInstance();

/**
 * 翻译函数 - 兼容主项目接口
 */
export function t(key: string): string {
  return i18n.t(key);
}

/**
 * 设置语言 - 兼容主项目接口
 */
export function setLanguage(language: SupportedLanguage): void {
  i18n.setLanguage(language);
}

/**
 * 获取当前语言 - 兼容主项目接口
 */
export function getCurrentLanguage(): SupportedLanguage {
  return i18n.getCurrentLanguage();
}