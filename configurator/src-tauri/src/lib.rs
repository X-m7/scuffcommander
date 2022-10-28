pub mod actions;
pub mod config;
pub mod pages;
pub mod plugins;

pub struct UIConfigState(pub async_std::sync::Mutex<scuffcommander_core::UIConfig>);
