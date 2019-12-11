import Vue from 'vue';
import VueRouter from 'vue-router';
import Cookies from 'js-cookie';

import Signin from '@Pages/Signin';
import Signout from '@Pages/Signout';
import NotFound from '@Pages/NotFound';
import Home from '@Pages/Home';

// カテゴリー
import Categories from '@Pages/Categories';
import CategoryManagement from '@Pages/Categories/Management';
import CategoryEdit from '@Pages/Categories/Edit';

// 記事
import Articles from '@Pages/Articles';
import ArticleList from '@Pages/Articles/List';
import ArticleDetail from '@Pages/Articles/Detail';
import ArticleEdit from '@Pages/Articles/Edit';
import ArticlePost from '@Pages/Articles/Post';
import ArticleTrashed from '@Pages/Articles/Trashed';
import ArticleAuthorList from '@Pages/Articles/AuthorList';

// 自分のアカウントページ
import Profile from '@Pages/Profile';

// ユーザー
import Users from '@Pages/Users';
import UserList from '@Pages/Users/List';
import UserDetail from '@Pages/Users/Detail';
import UserCreate from '@Pages/Users/Create';

// パスワード
import PasswordInit from '@Pages/Password/init';
import PasswordUpdate from '@Pages/Password/update';

import Store from '../_store';

Vue.use(VueRouter);
const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      name: 'signin',
      path: '/signin',
      component: Signin,
      meta: {
        isPublic: true,
      },
      beforeEnter: (to, from, next) => {
        const token = Cookies.get('user-token') || null;
        return token ? next('/') : next();
      },
    },
    {
      name: 'signout',
      path: '/signout',
      component: Signout,
      props: true,
      beforeEnter: (to, from, next) => {
        const token = Cookies.get('user-token') || null;
        return token ? next() : next('/signin');
      },
    },
    {
      name: 'home',
      path: '/',
      component: Home,
    },
    {
      name: 'passwordInit',
      path: '/password/init',
      component: PasswordInit,
    },
    {
      name: 'passwordUpdate',
      path: '/password/update',
      component: PasswordUpdate,
    },
    {
      name: 'profile',
      path: '/profile',
      component: Profile,
    },
    {
      path: '/articles',
      component: Articles,
      children: [
        {
          name: 'articleList',
          path: '',
          component: ArticleList,
          beforeEnter(to, from, next) {
            /**
             * 記事作成、記事更新、記事削除からリダイレクトするときは?redirect=リダイレクト元のurlのパラメータを
             * 渡してリダイレクト、パラメータが存在する場合はclearMessageアクションを通知しない
             */
            const isArticle = from.name ? from.name.indexOf('article') >= 0 : false;
            const isRedirect = to.query.redirect;
            if (isArticle && isRedirect) {
              next();
            } else {
              Store.dispatch('articles/clearMessage');
              next();
            }
          },
        },
        {
          name: 'articlePost',
          path: 'post',
          component: ArticlePost,
        },
        {
          name: 'articleTrashed',
          path: 'trashed',
          component: ArticleTrashed,
        },
        {
          name: 'articleAuthorList',
          path: 'author_list',
          component: ArticleAuthorList,
        },
        {
          name: 'articleDetail',
          path: ':id',
          component: ArticleDetail,
        },
        {
          name: 'articleEdit',
          path: ':id/edit',
          component: ArticleEdit,
        },
      ],
    },
    {
      path: '/users',
      component: Users,
      children: [
        {
          name: 'allUsers',
          path: '',
          component: UserList,
        },
        {
          name: 'userCreate',
          path: 'create',
          component: UserCreate,
        },
        {
          name: 'userDetail',
          path: ':id',
          component: UserDetail,
        },
      ],
    },
    {
      path: '/categories',
      component: Categories,
      children: [
        {
          name: 'categoryManegement',
          path: '',
          component: CategoryManagement,
        },
        {
          name: 'categoryEdit',
          path: ':id',
          component: CategoryEdit,
        },
      ],
    },
    {
      name: 'notfound',
      path: '/*',
      component: NotFound,
      meta: {
        isPublic: true,
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const token = Cookies.get('user-token') || null;
  const isPublic = to.matched.some(page => page.meta.isPublic);
  const toSignOut = to.matched.some(page => page.path === '/signout');
  const toPasswordInit = to.matched.some(page => page.path === '/password/init');

  // パブリック、サインアウト、初期化の場合
  if (isPublic || toSignOut) {
    return next();
  }

  // ログインしている場合
  if (token) {
    // tokenのチェック
    Store.dispatch('auth/checkAuth', { token })
      .then(() => {
        // パスワードの初期化が完了していない場合
        if (
          !Store.state.auth.user.password_reset_flg
          && !toPasswordInit
        ) {
          return next('/password/init');
        }
        if (
          Store.state.auth.user.password_reset_flg
          && toPasswordInit
        ) {
          return next('/');
        }
        return next();
      }).catch(() => {
        const query = to.fullPath === '/signout'
        || to.fullPath === '/password/init'
          ? {}
          : { redirect: to.fullPath };
        return next({ path: '/signin', query });
      });
  } else {
    // それ以外の場合
    next('/signin');
  }
  return true;
});

export default router;
