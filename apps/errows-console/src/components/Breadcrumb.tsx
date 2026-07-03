import { Breadcrumb, BreadcrumbProps } from 'antd';
import { useNavigate, useLocation } from 'react-router';
import { HomeOutlined } from '@ant-design/icons';
import { routes } from '@/routes';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

/**
 * 根据路由动态生成面包屑
 */
export const BreadcrumbNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // 找到当前路由对应的名称
  const getBreadcrumbItems = (): BreadcrumbProps['items'] => {
    const items: BreadcrumbProps['items'] = [
      {
        title: <HomeOutlined style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')} />,
        onClick: () => navigate('/dashboard'),
      },
    ];

    // 递归查找路由
    const findRoutePath = (
      routeList: typeof routes,
      pathSegments: string[],
      currentPath: string = ''
    ) => {
      for (const route of routeList) {
        const fullPath = route.path;

        if (fullPath === currentPath) {
          items.push({
            title: <span style={{ cursor: 'pointer' }}>{route.name}</span>,
            onClick: () => navigate(fullPath),
          });
          return true;
        }

        if (route.children) {
          for (const child of route.children) {
            const childFullPath = child.path;

            if (childFullPath === pathname) {
              items.push({
                title: <span style={{ cursor: 'pointer' }}>{route.name}</span>,
                onClick: () => navigate(route.path),
              });
              items.push({
                title: child.name,
              });
              return true;
            }
          }
        }
      }

      return false;
    };

    findRoutePath(routes, pathname.split('/').filter(Boolean));

    return items;
  };

  return (
    <Breadcrumb
      items={getBreadcrumbItems()}
      style={{ marginBottom: 16 }}
    />
  );
};

export default BreadcrumbNav;

