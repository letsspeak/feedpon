import categories from 'messaging/categories/initialState';
import credential from 'messaging/credential/initialState';
import notifications from 'messaging/notifications/initialState';
import search from 'messaging/search/initialState';
import sharedSiteinfo from 'messaging/sharedSiteinfo/initialState';
import streams from 'messaging/streams/initialState';
import subscriptions from 'messaging/subscriptions/initialState';
import trackingUrlPatterns from 'messaging/trackingUrlPatterns/initialState';
import user from 'messaging/user/initialState';
import userSiteinfo from 'messaging/userSiteinfo/initialState';
import ui from 'messaging/ui/initialState';
import { State } from 'messaging/types';

const initialState: State = {
    categories,
    credential,
    notifications,
    search,
    sharedSiteinfo,
    streams,
    subscriptions,
    trackingUrlPatterns,
    ui,
    user,
    userSiteinfo
};

export default initialState;
