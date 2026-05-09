// components/DismissKeyboard.js
import React from 'react';
import { TouchableWithoutFeedback, Keyboard, View } from 'react-native';

const DismissKeyboard = ({ children }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={{ flex: 1 }}>
      {children}
    </View>
  </TouchableWithoutFeedback>
);

export default DismissKeyboard;