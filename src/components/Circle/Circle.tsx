import { useState } from 'react';
import { CircleHub } from './CircleHub';
import { SubscriptionDetail } from './SubscriptionDetail';
import { ExploreSubs } from './ExploreSubs';
import { AddFriend } from './AddFriend';
import { FriendList } from './FriendList';
import { TipComposer } from './TipComposer';
import { CircleQueueBrowser } from './CircleQueueBrowser';
import { CircleSettings } from './CircleSettings';
import { FriendHistory } from './FriendHistory';
import type { CircleView } from './constants';

interface CircleProps {
  view: CircleView;
  setView: (v: CircleView) => void;
  selectedSubHandle: string | null;
  setSelectedSubHandle: (h: string | null) => void;
  selectedFriendHandle: string | null;
  setSelectedFriendHandle: (h: string | null) => void;
  initialQueueKey: string | null;
  onCastItem: (previewUrl: string, title: string, queueKey?: string) => void;
  // True while a campaign owns the e-ink case — casting posters / queue images /
  // gifts is disabled until it completes (App also blocks it at onCastItem; this
  // dims the affordances so the rule reads visually, like the Cast tab).
  castLocked: boolean;
  // The queue browser is launched from the Cast tab, so Back must return there
  // (not the Circle hub). App owns the tab switch.
  onExitQueue: () => void;
}

export function Circle({
  view,
  setView,
  selectedSubHandle,
  setSelectedSubHandle,
  selectedFriendHandle,
  setSelectedFriendHandle,
  initialQueueKey,
  onCastItem,
  castLocked,
  onExitQueue,
}: CircleProps) {
  // friend-history and add-friend are both reachable from two places (the hub
  // and the full friend list). Remember which one launched them so Back returns
  // to the actual previous page instead of a hardcoded 'main'.
  const [historyBack, setHistoryBack] = useState<CircleView>('main');
  const [addFriendBack, setAddFriendBack] = useState<CircleView>('main');
  // A sub detail is reachable from the hub and from Explore — remember which so
  // Back returns to the actual previous page.
  const [subDetailBack, setSubDetailBack] = useState<CircleView>('main');

  if (view === 'subscription-detail' && selectedSubHandle) {
    return (
      <SubscriptionDetail
        creatorHandle={selectedSubHandle}
        castLocked={castLocked}
        onBack={() => {
          setSelectedSubHandle(null);
          setView(subDetailBack);
        }}
        // Tapping a poster casts it straight to the case.
        onCastPost={(previewUrl, title) => onCastItem(previewUrl, title)}
      />
    );
  }

  if (view === 'explore-subs') {
    return (
      <ExploreSubs
        onBack={() => setView('main')}
        onOpenSubscription={(handle) => {
          setSubDetailBack('explore-subs');
          setSelectedSubHandle(handle);
          setView('subscription-detail');
        }}
      />
    );
  }

  if (view === 'add-friend') {
    return (
      <AddFriend
        onBack={() => setView(addFriendBack)}
        onAdded={() => setView(addFriendBack)}
      />
    );
  }

  if (view === 'friend-list') {
    return (
      <FriendList
        onBack={() => setView('main')}
        onOpenFriend={(handle) => {
          setHistoryBack('friend-list');
          setSelectedFriendHandle(handle);
          setView('friend-history');
        }}
        onOpenAddFriend={() => {
          setAddFriendBack('friend-list');
          setView('add-friend');
        }}
      />
    );
  }

  if (view === 'tip-composer' && selectedFriendHandle) {
    return (
      <TipComposer
        friendHandle={selectedFriendHandle}
        // Composer is entered from friend-history — closing (× top-left) or
        // sending both drop back to that history so the user sees their new
        // gift land in the feed.
        onClose={() => setView('friend-history')}
        onSent={() => setView('friend-history')}
      />
    );
  }

  if (view === 'queue-browser') {
    return (
      <CircleQueueBrowser
        onBack={onExitQueue}
        initialKey={initialQueueKey ?? undefined}
        castLocked={castLocked}
        onCast={(item) => {
          // Hand the card to the Cast Preview flow, tagged with its key so it's
          // dismissed on confirm and Preview → Back can reopen the browser here.
          onCastItem(item.previewUrl || '', item.headline, item.key);
        }}
      />
    );
  }

  if (view === 'settings') {
    return <CircleSettings onBack={() => setView('main')} />;
  }

  if (view === 'friend-history' && selectedFriendHandle) {
    return (
      <FriendHistory
        friendHandle={selectedFriendHandle}
        castLocked={castLocked}
        onBack={() => {
          setSelectedFriendHandle(null);
          setView(historyBack);
        }}
        // Send-gift row at the bottom is the discoverable jump into the tip
        // composer — keeps the friend context, doesn't reset selection.
        onSendGift={() => setView('tip-composer')}
        // Tapping a gift image casts it to the case.
        onCastImage={(previewUrl, title) => onCastItem(previewUrl, title)}
      />
    );
  }

  return (
    <CircleHub
      onOpenAddFriend={() => {
        setAddFriendBack('main');
        setView('add-friend');
      }}
      onOpenFriend={(handle) => {
        // Tapping a friend now opens their gift history first — the composer
        // is reached from the CTA at the bottom of that page.
        setHistoryBack('main');
        setSelectedFriendHandle(handle);
        setView('friend-history');
      }}
      onOpenSubscription={(handle) => {
        setSubDetailBack('main');
        setSelectedSubHandle(handle);
        setView('subscription-detail');
      }}
      onOpenExplore={() => setView('explore-subs')}
      onOpenSettings={() => setView('settings')}
      onOpenFriendList={() => setView('friend-list')}
    />
  );
}
