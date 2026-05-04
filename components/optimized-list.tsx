import { LegendList } from '@legendapp/list';
import type { ReactElement } from 'react';

type Props<T> = {
  data: T[];
  renderItem: (info: { item: T; index: number }) => ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  refreshing: boolean;
  onRefresh: () => void;
  ListHeaderComponent?: ReactElement | null;
  contentContainerStyle?: any;
};

export function OptimizedList<T>(props: Props<T>) {
  return (
    <LegendList
      data={props.data}
      renderItem={({ item, index }) => props.renderItem({ item, index })}
      keyExtractor={props.keyExtractor}
      refreshing={props.refreshing}
      onRefresh={props.onRefresh}
      ListHeaderComponent={props.ListHeaderComponent ?? null}
      contentContainerStyle={props.contentContainerStyle}
      recycleItems
      drawDistance={800}
    />
  );
}
