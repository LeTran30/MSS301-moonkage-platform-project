import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/shared/config';
import { toast } from '@/shared/ui';
import { toggleTheme, getTheme } from '@/shared/lib/theme';
import { switchDemoActor, DEMO_ACTORS } from '@/entities/user';
import type { CommandItem } from '../model/commandTypes';

/**
 * Kho lệnh của Command Palette (Ctrl/Cmd+K).
 *
 * Tách riêng khỏi component hiển thị để giữ widget nhẹ và dễ test.
 */
export function useCommandRegistry(): CommandItem[] {
  const navigate = useNavigate();

  return useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // 1. Tác vụ nhanh
      {
        id: 'toggle-theme',
        title: `Chuyển sang giao diện ${getTheme() === 'dark' ? 'Sáng (Trăng Thanh)' : 'Tối (Đêm Rằm)'}`,
        description: 'Chuyển đổi bảng màu toàn hệ thống',
        category: 'Lối tắt tác vụ',
        icon: 'check',
        shortcut: 'T',
        action: () => {
          toggleTheme();
          toast.info(`Đã đổi theme: ${getTheme() === 'dark' ? 'Đêm Rằm (Dark)' : 'Trăng Thanh (Light)'}`);
        },
      },
      {
        id: 'bulk-rfq',
        title: 'Tạo yêu cầu báo giá sỉ doanh nghiệp (RFQ)',
        description: 'Mở wizard yêu cầu báo giá số lượng lớn',
        category: 'Lối tắt tác vụ',
        icon: 'package',
        action: () => navigate(routes.base.quoteRequestNew),
      },
      {
        id: 'verify-nfc',
        title: 'Xác thực tem chống giả NFC / QR',
        description: 'Kiểm tra hộp bánh và chứng thư số blockchain',
        category: 'Lối tắt tác vụ',
        icon: 'check',
        action: () => navigate(routes.account.verify),
      },

      // 2. Chuyển đổi Persona Demo
      ...Object.entries(DEMO_ACTORS).map(
        ([key, actor]): CommandItem => ({
          id: `persona-${actor.id}`,
          title: `Đóng vai: ${actor.name}`,
          description: `Chuyển quyền sang vai trò ${actor.role}${actor.vendorName ? ` — ${actor.vendorName}` : ''}`,
          category: 'Đổi Persona',
          icon: 'user',
          action: () => {
            switchDemoActor(key);
            toast.success(`Đã chuyển vai sang ${actor.name}!`);
            if (actor.role === 'VENDOR') navigate(routes.vendor.overview);
            else if (actor.role === 'ADMIN') navigate(routes.admin.overview);
            else navigate(routes.base.home);
          },
        })
      ),

      // 3. Điều hướng sàn bán lẻ
      {
        id: 'nav-catalog',
        title: 'Xem danh mục bánh Trung Thu',
        description: 'Lọc theo vị nhân, loại vỏ, thương hiệu và mức giá',
        category: 'Khu vực mua sắm',
        icon: 'search',
        action: () => navigate(routes.base.catalog),
      },
      {
        id: 'nav-bulk',
        title: 'Trung tâm Doanh nghiệp & Đặt số lượng lớn',
        description: 'Báo giá theo tier, chiết khấu và thiết kế hộp riêng',
        category: 'Khu vực mua sắm',
        icon: 'package',
        action: () => navigate(routes.base.bulk),
      },
      {
        id: 'nav-vendors',
        title: 'Danh sách nghệ nhân & xưởng bánh uy tín',
        description: 'Xem hồ sơ năng lực xưởng, chứng nhận VSATTP',
        category: 'Khu vực mua sắm',
        icon: 'package',
        action: () => navigate(routes.base.vendors),
      },
      {
        id: 'nav-cart',
        title: 'Mở giỏ hàng',
        description: 'Xem các sản phẩm đã chọn và tiến hành đặt',
        category: 'Khu vực mua sắm',
        icon: 'cart',
        action: () => navigate(routes.base.cart),
      },

      // 4. Kênh Bán & Quản trị
      {
        id: 'nav-vendor-overview',
        title: 'Kênh Xưởng: Bảng điều khiển kinh doanh',
        description: 'Theo dõi doanh thu, đơn hàng xưởng và yêu cầu báo giá',
        category: 'Kênh xưởng & Quản trị',
        icon: 'package',
        action: () => navigate(routes.vendor.overview),
      },
      {
        id: 'nav-vendor-products',
        title: 'Kênh Xưởng: Quản lý sản phẩm & lô sản xuất',
        description: 'Đăng sản phẩm mới, cập nhật giá và tồn kho',
        category: 'Kênh xưởng & Quản trị',
        icon: 'package',
        action: () => navigate(routes.vendor.products),
      },
      {
        id: 'nav-vendor-requests',
        title: 'Kênh Xưởng: Yêu cầu báo giá sỉ chờ phản hồi',
        description: 'Xem RFQ từ doanh nghiệp và gửi báo giá cạnh tranh',
        category: 'Kênh xưởng & Quản trị',
        icon: 'package',
        action: () => navigate(routes.vendor.requests),
      },
      {
        id: 'nav-vendor-money',
        title: 'Kênh Xưởng: Ví doanh thu & Yêu cầu rút tiền Escrow',
        description: 'Theo dõi tiền ký quỹ tạm giữ và yêu cầu giải ngân',
        category: 'Kênh xưởng & Quản trị',
        icon: 'package',
        action: () => navigate(routes.vendor.money),
      },
      {
        id: 'nav-admin-overview',
        title: 'Quản Trị: Trung tâm kiểm soát toàn sàn (Admin)',
        description: 'Theo dõi GMV, tỷ lệ tranh chấp, kiểm duyệt xưởng',
        category: 'Kênh xưởng & Quản trị',
        icon: 'package',
        action: () => navigate(routes.admin.overview),
      },
      {
        id: 'nav-admin-disputes',
        title: 'Quản Trị: Giải quyết tranh chấp Escrow',
        description: 'Trọng tài xử lý khiếu nại giữa doanh nghiệp và xưởng',
        category: 'Kênh xưởng & Quản trị',
        icon: 'package',
        action: () => navigate(routes.admin.disputes),
      },
      {
        id: 'nav-admin-money',
        title: 'Quản Trị: Đối soát tài chính & Phê duyệt giải ngân',
        description: 'Kiểm soát dòng tiền tạm giữ escrow và phí sàn',
        category: 'Kênh xưởng & Quản trị',
        icon: 'package',
        action: () => navigate(routes.admin.money),
      },

      // 5. Tài liệu & IA
      {
        id: 'nav-sitemap',
        title: 'Sơ đồ cây trang tương tác (Sitemap Tree)',
        description: 'Xem cấu trúc 40+ màn hình chia theo 4 khu vực phân quyền',
        category: 'Sơ đồ & Hướng dẫn',
        icon: 'package',
        action: () => navigate(routes.system.sitemap),
      },
      {
        id: 'nav-policy',
        title: 'Chính sách kiểm soát chất lượng & Ký quỹ Escrow',
        description: 'Quy trình bảo vệ thanh toán và tiêu chuẩn NFC chống giả',
        category: 'Sơ đồ & Hướng dẫn',
        icon: 'check',
        action: () => navigate(routes.base.policy),
      },
    ];

    return list;
  }, [navigate]);
}
