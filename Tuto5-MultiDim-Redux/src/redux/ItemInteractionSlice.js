import { createSlice } from '@reduxjs/toolkit'


export const itemInteractionSlice = createSlice({
  name: 'itemInteraction',
  initialState: {
    selectedItems: [],
    hoveredItem:{}
  },
  // initialState:[] if you need an array
  reducers: {
    setSelectedItems: (state, action) => {
      return {...state, selectedItems: action.payload}
    },
    setHoveredItem: (state, action) => {
      return {...state, hoveredItem: action.payload}
    },
    // addValueToAnArray: (state, action) => {
    //   return [...state, action.payload]
    // },
    // updateAnArray: state => {
    //   return state.map(item=>{
    //     if (itemData.index === action.payload.index) {
    //       return {...itemData, keyToUpdate: action.payload.valueToUpdate};
    //     } else {
    //       return itemData;
    //     }
    //   })
    // },
  },
})

// Action creators are generated for each case reducer function
export const { setSelectedItems, setHoveredItem/* , addValueToAnArray, updateAnArray */ } = itemInteractionSlice.actions

export default itemInteractionSlice.reducer