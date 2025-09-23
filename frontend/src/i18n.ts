import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        news: 'News',
        admin: 'Admin',
        dashboard: 'Dashboard'
      },
      // Homepage
      home: {
        title: 'Bilingual News Management System',
        subtitle: 'Stay informed with news in both English and Russian',
        features: 'Key Features',
        latestNews: 'Latest News',
        readMore: 'Read More'
      },
      // News
      news: {
        title: 'Latest News',
        category: 'Category',
        date: 'Date',
        noNews: 'No news available'
      },
      // Admin
      admin: {
        title: 'Admin Dashboard',
        posts: 'Posts',
        categories: 'Categories',
        users: 'Users',
        settings: 'Settings',
        createPost: 'Create Post',
        editPost: 'Edit Post',
        deletePost: 'Delete Post',
        title_en: 'Title (English)',
        title_ru: 'Title (Russian)',
        content_en: 'Content (English)',
        content_ru: 'Content (Russian)',
        category: 'Category',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        actions: 'Actions'
      },
      // Authentication
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        email: 'Email',
        password: 'Password',
        firstName: 'First Name',
        lastName: 'Last Name',
        confirmPassword: 'Confirm Password',
        rememberMe: 'Remember me',
        logout: 'Logout',
        signingIn: 'Signing in...',
        emailRequired: 'Email is required',
        emailInvalid: 'Email is invalid',
        passwordRequired: 'Password is required',
        passwordMinLength: 'Password must be at least 6 characters',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?'
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        language: 'Language'
      }
    }
  },
  ru: {
    translation: {
      // Navigation
      nav: {
        home: 'Главная',
        news: 'Новости',
        admin: 'Админ',
        dashboard: 'Панель управления'
      },
      // Homepage
      home: {
        title: 'Двуязычная система управления новостями',
        subtitle: 'Оставайтесь в курсе новостей на английском и русском языках',
        features: 'Ключевые функции',
        latestNews: 'Последние новости',
        readMore: 'Читать далее'
      },
      // News
      news: {
        title: 'Последние новости',
        category: 'Категория',
        date: 'Дата',
        noNews: 'Новости отсутствуют'
      },
      // Admin
      admin: {
        title: 'Панель администратора',
        posts: 'Посты',
        categories: 'Категории',
        users: 'Пользователи',
        settings: 'Настройки',
        createPost: 'Создать пост',
        editPost: 'Редактировать пост',
        deletePost: 'Удалить пост',
        title_en: 'Заголовок (Английский)',
        title_ru: 'Заголовок (Русский)',
        content_en: 'Содержание (Английский)',
        content_ru: 'Содержание (Русский)',
        category: 'Категория',
        save: 'Сохранить',
        cancel: 'Отмена',
        delete: 'Удалить',
        edit: 'Редактировать',
        actions: 'Действия'
      },
      // Authentication
      auth: {
        signIn: 'Войти',
        signUp: 'Регистрация',
        email: 'Email',
        password: 'Пароль',
        firstName: 'Имя',
        lastName: 'Фамилия',
        confirmPassword: 'Подтвердите пароль',
        rememberMe: 'Запомнить меня',
        logout: 'Выйти',
        signingIn: 'Вход...',
        emailRequired: 'Email обязателен',
        emailInvalid: 'Неверный Email',
        passwordRequired: 'Пароль обязателен',
        passwordMinLength: 'Пароль должен содержать минимум 6 символов',
        emailPlaceholder: 'Введите ваш email',
        passwordPlaceholder: 'Введите ваш пароль',
        noAccount: 'Нет аккаунта?',
        hasAccount: 'Уже есть аккаунт?'
      },
      // Common
      common: {
        loading: 'Загрузка...',
        error: 'Ошибка',
        success: 'Успех',
        language: 'Язык'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;