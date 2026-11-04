import { useCurrentUser, switchDemoActor, DEMO_ACTORS } from '@/entities/user';
import { Badge, Button } from '@/shared/ui';
import styles from './QuickPersonaSelector.module.css';

interface PersonaOption {
  key: keyof typeof DEMO_ACTORS;
  name: string;
  badge: string;
  tone: 'gold' | 'green' | 'red' | 'neutral';
}

const PERSONAS: PersonaOption[] = [
  { key: 'lan', name: 'Nguyễn Thị Lan (Cá nhân)', badge: 'Khách lẻ M1', tone: 'neutral' },
  { key: 'hoa', name: 'CTCP Tập đoàn Alpha', badge: 'Doanh nghiệp M5', tone: 'gold' },
  { key: 'quan', name: 'Trần Văn Quân (Hiệu Bảo An)', badge: 'Chủ xưởng B1-B6', tone: 'green' },
  { key: 'admin', name: 'Nguyễn Thùy Linh (Quản trị)', badge: 'Admin sàn Q1-Q6', tone: 'red' },
];

export function QuickPersonaSelector() {
  const currentUser = useCurrentUser();

  return (
    <div className={styles.container}>
      <span className={styles.label}>Chuyển vai thử nghiệm (Persona Demo):</span>
      <div className={styles.list}>
        {PERSONAS.map((p) => {
          // `DEMO_ACTORS[p.key]` có thể `undefined` nếu khoá bị gõ sai — trước
          // đây chỗ này ném lỗi `Cannot read properties of undefined` và làm
          // hỏng **toàn bộ** trang (mọi màn hình đều dùng selector này).
          const actor = DEMO_ACTORS[p.key];
          if (!actor) return null;

          const isSelected = currentUser?.id === actor.id;
          return (
            <Button
              key={p.key}
              size="sm"
              variant={isSelected ? 'primary' : 'secondary'}
              className={styles.button}
              onClick={() => switchDemoActor(p.key)}
            >
              <span>{p.name}</span>
              <Badge tone={p.tone} size="sm">{p.badge}</Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
