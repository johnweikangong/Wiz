import React from 'react';
import {
    FlatList,
    View,
    Platform,
    Image,
    Keyboard,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { InteractionManager } from 'react-native';
import {
    RkButton,
    RkText,
    RkAvoidKeyboard,
    RkStyleSheet,
} from 'react-native-ui-kitten';
import _ from 'lodash';
import { scale } from './utils/scale';
import DialogFlow from 'react-native-dialogflow';
import Speech from 'react-native-android-speech';
//import moment from 'moment';
const Images = {
    'Sure Chloe. Check out this article!': { image: require('./data/img/buyingHouse.png') }
};
// mortgage
export default class App extends React.Component {
    constructor(props) {
        super(props);
        let conversation = { messages: [{ id: 0, time: 0, type: 'in', text: 'Hi Chloe, How can I help you today?' }]};
        this.state = {
            message: '',
            data: conversation,
            isRecording: false,
            runContent: 1,
            error: ''
        };
        DialogFlow.setConfiguration(
            "ede28d0302064961bd21492d85a27104", DialogFlow.LANG_ENGLISH
        );
    }

    componentWillMount() {
        this._speakMessage(this.state.data.messages[0].text);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
          this.refs.list.scrollToEnd();
        });
    }

    _renderNavBar = () =>
        (
            <View style={styles.navBarContainer}>
                <View style={styles.header}>
                    <RkText style={styles.name} rkType='header5'>Wiz</RkText>
                </View>
                <Image style={styles.avatar} resizeMode={'contain'} source={require('./data/img/avatars/house.png')}/>
            </View>
        );

    _keyExtractor = (post, index) => {
        return `${post.id}`;
    };

    _renderItem = (info) => {
        let inMessage = info.item.type === 'in';
        let backgroundColor = inMessage
            ? '#388FFF'
            : '#DDDAD9';
        let itemStyle = inMessage ? styles.itemIn : styles.itemOut;
        let renderDate = (time) =>
            (
                <RkText style={styles.time} rkType='secondary7 hintColor'>
                    {/*moment(new Date().getTime()).format('LT')*/}
                </RkText>
            );
        return (
            <View>
                <View style={[styles.item, itemStyle]}>
                    {!inMessage && renderDate(info.item.time)}
                    <View style={[styles.balloon, {backgroundColor}]}>
                        <RkText rkType='primary2 mediumLine chat' style={itemStyle}>{info.item.text}</RkText>
                    </View>
                    {inMessage && renderDate(info.item.time)}
                </View>
            {
                info.item.image &&
                <View style={[styles.item, itemStyle]}>
                    {!inMessage && renderDate(info.item.time)}
                    <View style={[styles.balloon, {backgroundColor}]}>
                        <Image style={styles.image} resizeMode={'contain'} source={info.item.image}/>
                    </View>
                    {inMessage && renderDate(info.item.time)}
                </View>
            }
            </View>
        )
    };

    _scroll() {
        if (Platform.OS === 'ios') {
            this.refs.list.scrollToEnd();
        } else {
            _.delay(() => this.refs.list.scrollToEnd(), 100);
        }
    }

    _pushMessage = (result, textMessage = undefined) => {
        let userText = textMessage ? textMessage : result.result.resolvedQuery; // User
        let botText = result.result.fulfillment.speech; // Chatbot
        console.log(userText);
        console.log(botText);
        this.state.data.messages.push({
            id: this.state.data.messages.length,
            time: 0,
            type: 'out',
            text: userText
        });
        this.state.data.messages.push({
            id: this.state.data.messages.length,
            time: 0,
            type: 'in',
            text: botText,
            image: Images[botText] && Images[botText].image
        });
        this._scroll(true);
        this._speakMessage(botText);
        this.setState({ isRecording: false, runContent: 0 });
    };

    _sendSpeechMessage = () => {
        this.setState({ runContent: 1 });
        if (this.state.isRecording) {
            DialogFlow.finishListening();
            this.setState({ isRecording: false });
        } else {
            DialogFlow.startListening(result =>
                {
                    if (this.state.runContent === 1) {
                        this._pushMessage(result);
                    }
                }, error => {
                  this.setState({ error });
            });
            this.setState({ isRecording: true });
        }
    };

    _sendTextMessage = () => {
        if (!this.state.message)
            return;
        DialogFlow.requestQuery(this.state.message, result =>
            {
                    this._pushMessage(result);
                    this.setState({ message: '', runContent: 1 });
            }, error => {
            this.setState({ error });
        });
        this._scroll(true);
    };

    _speakMessage = (message) => {
        Speech.speak({
            text: message, // Mandatory
            pitch: 1, // Optional Parameter to set the pitch of Speech,
            forceStop: false, //  Optional Parameter if true , it will stop TTS if it is already in process
            language: 'en', // Optional Paramenter Default is en you can provide any supported lang by TTS
            language: 'en', // Optional Paramenter Default is en you can provide any supported lang by TTS
            country: 'US' // Optional Paramenter Default is null, it provoques that system selects its default
        });
    };

    render() {
        return (
            <RkAvoidKeyboard style={styles.container} onResponderRelease={(event) => {
                Keyboard.dismiss();
            }}>
                {this._renderNavBar()}
                <FlatList
                    ref='list'
                    extraData={this.state}
                    style={styles.list}
                    data={this.state.data.messages}
                    keyExtractor={this._keyExtractor}
                    renderItem={this._renderItem}/>
                <View style={styles.footer}>
                    <RkButton onPress={() => this._sendSpeechMessage()} style={styles.button} rkType='circle highlight'>
                        {
                            this.state.isRecording ?
                                <ActivityIndicator color={'#FFFFFF'} /> :
                                <Image style={{height: scale(20), width: scale(20)}} source={require('./assets/icons/recordingIcon.png')}/>
                        }
                        </RkButton>
                    <TextInput
                        onFocus={() => this._scroll(true)}
                        onBlur={() => this._scroll(true)}
                        onChangeText={(message) => this.setState({message})}
                        value={this.state.message}
                        style={styles.textInput}
                        underlineColorAndroid={'transparent'}
                        placeholder={'Ask me a question!'}
                    />
                    <RkButton onPress={() => this._sendTextMessage()} style={styles.button} rkType='circle highlight'>
                        <Image source={require('./assets/icons/sendIcon.png')}/>
                    </RkButton>
                </View>
            </RkAvoidKeyboard>
        )
    }
}

let styles = RkStyleSheet.create(theme => ({
    navBarContainer: {
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0E9E2',
        elevation: 3,
        shadowColor: '#000000',
        shadowOpacity: 0.5,
        shadowRadius: 1,
        shadowOffset: {
            height: 1,
            width: 1
        }
    },
    header: {
        flex: 1,
        marginTop: 5,
        marginLeft: 60,
        alignItems: 'center'
    },
    name: {
        fontSize: 20,
        fontWeight: '500'
    },
    avatar: {
        flex: 0.3,
        height: 40,
        width: 40,
        borderRadius: 164
    },
    container: {
        flex: 1
    },
    list: {
        paddingHorizontal: 17
    },
    footer: {
        flexDirection: 'row',
        minHeight: 60,
        padding: 10,
        backgroundColor: '#F7F7F7'
    },
    item: {
        marginVertical: 14,
        flex: 1,
        flexDirection: 'row'
    },
    itemIn: {
        color: '#FFFFFF'
    },
    itemOut: {
        alignSelf: 'flex-end'
    },
    balloon: {
        maxWidth: scale(250),
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 15,
        borderRadius: 20,
    },
    time: {
        alignSelf: 'flex-end',
        margin: 15
    },
    plus: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginRight: 7
    },
    image: {
        height: scale(200),
        width: scale(200)
    },
    textInput: {
        flex: 1,
        flexDirection: 'row',
        marginLeft: 17,
        paddingLeft: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        elevation: 3,
        shadowColor: '#000000',
        shadowOpacity: 0.5,
        shadowRadius: 1,
        shadowOffset: {
            height: 1,
            width: 1
        }
    },
    button: {
        alignSelf: 'center',
        width: 40,
        height: 40,
        marginLeft: 10,
        elevation: 3,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 3
        },
        shadowRadius: 5,
        shadowOpacity: 1.0
    }
}));
