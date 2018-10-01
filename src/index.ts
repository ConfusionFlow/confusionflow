/**
 * Created by Caleydo Team on 31.08.2016.
 */

import 'file-loader?name=index.html!extract-loader!html-loader?interpolate!./index.html';
import './assets/favicon/favicon';
import 'file-loader?name=404.html-loader!./404.html';
import 'file-loader?name=robots.txt!./robots.txt';
import 'phovea_ui/src/_bootstrap';
import './style.scss';
import { create as createApp } from './app';
import { create as createHeader, AppHeaderLink } from 'phovea_ui/src/header';
import { Language } from './language';

createHeader(
  <HTMLElement>document.querySelector('#caleydoHeader'),
  { appLink: new AppHeaderLink(Language.APP_NAME) }
);

// modify the report bug link that it links directly to github issues
const reportBugLink: HTMLElement = (<HTMLElement>document.querySelector('[data-header="bugLink"] > a'));
reportBugLink.setAttribute('href', 'https://github.com/Caleydo/malevo/issues/new');
reportBugLink.setAttribute('target', '_blank');
reportBugLink.removeAttribute('data-toggle');
reportBugLink.removeAttribute('data-target');

const parent = document.querySelector('#app');
createApp(parent).init();
