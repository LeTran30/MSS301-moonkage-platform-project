import { Modal, Icon, Badge } from '@/shared/ui';
import { DEMO_ACTORS } from '@/entities/user';
import styles from './Header.module.css';

const ACTOR_DESCRIPTIONS: Record<keyof typeof DEMO_ACTORS, string> = {
  minh: 'Người mua lẻ: vài hộp cho gia đình (Flow 1: Mua lẻ)',
  lan: 'HR Doanh nghiệp: đặt 150 hộp có in logo (Flow 2: Báo giá & Maket)',
  thao: 'Tiệm quà: mua sỉ, mở Shop bán lại bánh (Flow 3, 4)',
  hoa: 'Chủ xưởng gia công: chỉ nhận đặt hàng, gửi báo giá & maket',
  quan: 'Chủ tiệm bánh phố cổ: có Shop và nhận đặt hàng',
  admin: 'Đội vận hành sàn: duyệt người bán, duyệt tiền, xử lý khiếu nại (Flow 5)',
};

interface ActorSwitcherModalProps {
  open: boolean;
  currentUserId: string;
  onSelect: (key: keyof typeof DEMO_ACTORS) => void;
  onClose: () => void;
}

/** Modal đổi nhân vật demo (6 nhân vật IA). */
export function ActorSwitcherModal({
  open,
  currentUserId,
  onSelect,
  onClose,
}: ActorSwitcherModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chọn nhân vật để chạy luồng trải nghiệm"
      description="Được thiết kế dựa trên 6 nhân vật chính trong tài liệu IA Moonkage (Mục 2)."
    >
      <div className={styles.actorList} role="radiogroup" aria-label="Nhân vật demo">
        {Object.entries(DEMO_ACTORS).map(([key, a]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={currentUserId === a.id}
            className={`${styles.actorCard} ${currentUserId === a.id ? styles.actorActive : ''}`}
            onClick={() => onSelect(key as keyof typeof DEMO_ACTORS)}
          >
            <div className={styles.actorAvatar}>
              <Icon
                name={a.role === 'VENDOR' ? 'store' : a.role === 'ADMIN' ? 'shield' : 'user'}
                size={24}
              />
            </div>
            <div className={styles.actorInfo}>
              <div className={styles.actorTitle}>
                <strong>{a.name}</strong>
                <Badge
                  tone={a.role === 'VENDOR' ? 'gold' : a.role === 'ADMIN' ? 'neutral' : 'red'}
                  size="sm"
                >
                  {a.role}
                </Badge>
              </div>
              <div className={styles.actorDesc}>
                {ACTOR_DESCRIPTIONS[key as keyof typeof DEMO_ACTORS]}
              </div>
            </div>
            {currentUserId === a.id && (
              <div className={styles.activePill}>
                <Icon name="check" size={16} /> Đang chọn
              </div>
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
