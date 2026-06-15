export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T'));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T'));
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T'));
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return formatDateTime(dateStr);
}

export function getTypeTagClass(type: string): string {
  switch (type) {
    case '推理': return 'tag-reasoning';
    case '情感': return 'tag-emotion';
    case '恐怖': return 'tag-horror';
    case '欢乐': return 'tag-fun';
    default: return 'tag-default';
  }
}

export function getTypeCoverClass(type: string): string {
  switch (type) {
    case '推理': return 'script-card-cover-reasoning';
    case '情感': return 'script-card-cover-emotion';
    case '恐怖': return 'script-card-cover-horror';
    case '欢乐': return 'script-card-cover-fun';
    default: return 'script-card-cover-default';
  }
}

export function getTypeEmoji(type: string): string {
  switch (type) {
    case '推理': return '🔍';
    case '情感': return '💕';
    case '恐怖': return '👻';
    case '欢乐': return '🎉';
    default: return '🎭';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'open': return '可报名';
    case 'full': return '已满员';
    case 'in_progress': return '进行中';
    case 'completed': return '已结束';
    case 'cancelled': return '已取消';
    case 'confirmed': return '已确认';
    case 'pending': return '待审核';
    case 'approved': return '已通过';
    case 'rejected': return '已拒绝';
    default: return status;
  }
}

export function renderDifficulty(level: number): string {
  return '★'.repeat(level) + '☆'.repeat(5 - level);
}
