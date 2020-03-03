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
                                <a href="modules/ChannelsModule.html" data-type="entity-link">ChannelsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' : 'data-target="#xs-controllers-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' :
                                            'id="xs-controllers-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' }>
                                            <li class="link">
                                                <a href="controllers/ChannelsController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ChannelsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' : 'data-target="#xs-injectables-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' :
                                        'id="xs-injectables-links-module-ChannelsModule-6ecb33f5cecb8d72dcc356f2fa817b58"' }>
                                        <li class="link">
                                            <a href="injectables/ChannelsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ChannelsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ContactsModule.html" data-type="entity-link">ContactsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' : 'data-target="#xs-controllers-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' :
                                            'id="xs-controllers-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' }>
                                            <li class="link">
                                                <a href="controllers/ContactsController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">ContactsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' : 'data-target="#xs-injectables-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' :
                                        'id="xs-injectables-links-module-ContactsModule-16985652aadc2c1b8e5b31a6e95a1346"' }>
                                        <li class="link">
                                            <a href="injectables/ContactsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>ContactsService</a>
                                        </li>
                                    </ul>
                                </li>
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
                                <a href="modules/DevelopmentModule.html" data-type="entity-link">DevelopmentModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-DevelopmentModule-882b6c143ec74b10761d432cbd5fd3e2"' : 'data-target="#xs-controllers-links-module-DevelopmentModule-882b6c143ec74b10761d432cbd5fd3e2"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DevelopmentModule-882b6c143ec74b10761d432cbd5fd3e2"' :
                                            'id="xs-controllers-links-module-DevelopmentModule-882b6c143ec74b10761d432cbd5fd3e2"' }>
                                            <li class="link">
                                                <a href="controllers/DevelopmentController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">DevelopmentController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/EventsModule.html" data-type="entity-link">EventsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' : 'data-target="#xs-controllers-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' :
                                            'id="xs-controllers-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' }>
                                            <li class="link">
                                                <a href="controllers/EventsController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">EventsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' : 'data-target="#xs-injectables-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' :
                                        'id="xs-injectables-links-module-EventsModule-5b7a2ddd37087fb9ae279e5dd2e35d1e"' }>
                                        <li class="link">
                                            <a href="injectables/EventsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>EventsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/IpfsModule.html" data-type="entity-link">IpfsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' : 'data-target="#xs-controllers-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' :
                                            'id="xs-controllers-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' }>
                                            <li class="link">
                                                <a href="controllers/IpfsController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">IpfsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' : 'data-target="#xs-injectables-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' :
                                        'id="xs-injectables-links-module-IpfsModule-2044649f90fa012517259efb5d2a712f"' }>
                                        <li class="link">
                                            <a href="injectables/IpfsService.html"
                                                data-type="entity-link" data-context="sub-entity" data-context-id="modules" }>IpfsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/KeyManagerModule.html" data-type="entity-link">KeyManagerModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/MessagesModule.html" data-type="entity-link">MessagesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#controllers-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' : 'data-target="#xs-controllers-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' :
                                            'id="xs-controllers-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' }>
                                            <li class="link">
                                                <a href="controllers/MessagesController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">MessagesController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' : 'data-target="#xs-injectables-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' :
                                        'id="xs-injectables-links-module-MessagesModule-739cff51a5836634b9e2d03a8e6bfc25"' }>
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
                                            'data-target="#controllers-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' : 'data-target="#xs-controllers-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' :
                                            'id="xs-controllers-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' }>
                                            <li class="link">
                                                <a href="controllers/UsersController.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">UsersController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' : 'data-target="#xs-injectables-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' :
                                        'id="xs-injectables-links-module-UsersModule-fcfee6d2cf9af236a6f417422d3af401"' }>
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
                                            'data-target="#controllers-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' : 'data-target="#xs-controllers-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' :
                                            'id="xs-controllers-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' }>
                                            <li class="link">
                                                <a href="controllers/Web3Controller.html"
                                                    data-type="entity-link" data-context="sub-entity" data-context-id="modules">Web3Controller</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' : 'data-target="#xs-injectables-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' :
                                        'id="xs-injectables-links-module-Web3Module-6a7186b8d699889a58bdb5d0b416121d"' }>
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
                                <a href="classes/Block.html" data-type="entity-link">Block</a>
                            </li>
                            <li class="link">
                                <a href="classes/Channel.html" data-type="entity-link">Channel</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChannelDto.html" data-type="entity-link">ChannelDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChannelMember.html" data-type="entity-link">ChannelMember</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChannelMemberDto.html" data-type="entity-link">ChannelMemberDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChannelMembersResolver.html" data-type="entity-link">ChannelMembersResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChannelMessage.html" data-type="entity-link">ChannelMessage</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChannelMessageDto.html" data-type="entity-link">ChannelMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ChannelResolver.html" data-type="entity-link">ChannelResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/Contact.html" data-type="entity-link">Contact</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContactDto.html" data-type="entity-link">ContactDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContactHandshakeDto.html" data-type="entity-link">ContactHandshakeDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/ContactsResolver.html" data-type="entity-link">ContactsResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateChannelDto.html" data-type="entity-link">CreateChannelDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateChannelMemberDto.html" data-type="entity-link">CreateChannelMemberDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateChannelMessageDto.html" data-type="entity-link">CreateChannelMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserDto.html" data-type="entity-link">CreateUserDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/CryptographyKeyPairDto.html" data-type="entity-link">CryptographyKeyPairDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/DbKeyManager.html" data-type="entity-link">DbKeyManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/DbKeyPair.html" data-type="entity-link">DbKeyPair</a>
                            </li>
                            <li class="link">
                                <a href="classes/EkhoEvent.html" data-type="entity-link">EkhoEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/EkhoEventDto.html" data-type="entity-link">EkhoEventDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/EncodedMessageDto.html" data-type="entity-link">EncodedMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/IpfsMessageDto.html" data-type="entity-link">IpfsMessageDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/Message.html" data-type="entity-link">Message</a>
                            </li>
                            <li class="link">
                                <a href="classes/ProcessReport.html" data-type="entity-link">ProcessReport</a>
                            </li>
                            <li class="link">
                                <a href="classes/RawMessageDto.html" data-type="entity-link">RawMessageDto</a>
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
                                <a href="classes/UsersResolver.html" data-type="entity-link">UsersResolver</a>
                            </li>
                            <li class="link">
                                <a href="classes/VaultKeyManager.html" data-type="entity-link">VaultKeyManager</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AnonKeySet.html" data-type="entity-link">AnonKeySet</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BroadcastAccountConfig.html" data-type="entity-link">BroadcastAccountConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EkhoWeb3Config.html" data-type="entity-link">EkhoWeb3Config</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KeyManager.html" data-type="entity-link">KeyManager</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SignedSharedSecret.html" data-type="entity-link">SignedSharedSecret</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StringIndexedObject.html" data-type="entity-link">StringIndexedObject</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestHelper.html" data-type="entity-link">TestHelper</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestSubject.html" data-type="entity-link">TestSubject</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestUsers.html" data-type="entity-link">TestUsers</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Web3Config.html" data-type="entity-link">Web3Config</a>
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