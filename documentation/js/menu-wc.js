'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">ekho documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link">AppModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/CryptographyModule.html" data-type="entity-link">CryptographyModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-CryptographyModule-ee008c77ac7df6e1a73acdb368c3a65d"' : 'data-target="#xs-injectables-links-module-CryptographyModule-ee008c77ac7df6e1a73acdb368c3a65d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CryptographyModule-ee008c77ac7df6e1a73acdb368c3a65d"' :
                                        'id="xs-injectables-links-module-CryptographyModule-ee008c77ac7df6e1a73acdb368c3a65d"' }>
                                        <li class="link">
                                            <a href="injectables/CryptographyService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>CryptographyService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/IpfsModule.html" data-type="entity-link">IpfsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' : 'data-target="#xs-controllers-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' :
                                            'id="xs-controllers-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' }>
                                            <li class="link">
                                                <a href="controllers/IpfsController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">IpfsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' : 'data-target="#xs-injectables-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' :
                                        'id="xs-injectables-links-module-IpfsModule-1b77bd9fc179ea7608c3d04be125c4df"' }>
                                        <li class="link">
                                            <a href="injectables/IpfsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>IpfsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MessagesModule.html" data-type="entity-link">MessagesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' : 'data-target="#xs-controllers-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' :
                                            'id="xs-controllers-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' }>
                                            <li class="link">
                                                <a href="controllers/MessagesController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MessagesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' : 'data-target="#xs-injectables-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' :
                                        'id="xs-injectables-links-module-MessagesModule-83e3f6a076ad6dad3068f70012012aa5"' }>
                                        <li class="link">
                                            <a href="injectables/MessagesService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>MessagesService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersModule.html" data-type="entity-link">UsersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' : 'data-target="#xs-controllers-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' :
                                            'id="xs-controllers-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' : 'data-target="#xs-injectables-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' :
                                        'id="xs-injectables-links-module-UsersModule-0ec125a3f2184d14c7690fa1175d8900"' }>
                                        <li class="link">
                                            <a href="injectables/UsersService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>UsersService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/Web3Module.html" data-type="entity-link">Web3Module</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' : 'data-target="#xs-controllers-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' :
                                            'id="xs-controllers-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' }>
                                            <li class="link">
                                                <a href="controllers/Web3Controller.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">Web3Controller</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' : 'data-target="#xs-injectables-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' :
                                        'id="xs-injectables-links-module-Web3Module-55f7386e1962c3fa064a0e6291ccc551"' }>
                                        <li class="link">
                                            <a href="injectables/Web3Service.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>Web3Service</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/CreateUserDto.html" data-type="entity-link">CreateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CryptographyKeyPairDto.html" data-type="entity-link">CryptographyKeyPairDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/IpfsMessageDto.html" data-type="entity-link">IpfsMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Message.html" data-type="entity-link">Message</a>
                            </li>
                            <li class="link">
                                <a href="classes/SendMessageDto.html" data-type="entity-link">SendMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/User.html" data-type="entity-link">User</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDto.html" data-type="entity-link">UserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Web3Factory.html" data-type="entity-link">Web3Factory</a>
                            </li>
                            <li class="link">
                                <a href="classes/Web3Transaction.html" data-type="entity-link">Web3Transaction</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});