use scuffcommander::plugins::obs::OBSAction;
use scuffcommander::plugins::vts::VTSAction;
use scuffcommander::plugins::PluginAction;
use scuffcommander::{Action, ActionConfig};
use std::collections::HashMap;

fn main() {
    let mut actions = ActionConfig {
        actions: HashMap::new(),
    };
    let chain = vec![
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "Qt.exp3.json".to_string(),
        ))),
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "expressiong.exp3.json".to_string(),
        ))),
    ];
    actions.actions.insert(
        "1".to_string(),
        Action::Single(PluginAction::OBS(OBSAction::SceneChange(
            "Waiting".to_string(),
        ))),
    );
    actions.actions.insert(
        "2".to_string(),
        Action::Single(PluginAction::OBS(OBSAction::SceneChange(
            "Desktop + VTS".to_string(),
        ))),
    );
    actions.actions.insert(
        "3".to_string(),
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "Qt.exp3.json".to_string(),
        ))),
    );
    actions.actions.insert(
        "4".to_string(),
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "expressiong.exp3.json".to_string(),
        ))),
    );
    actions
        .actions
        .insert("5".to_string(), Action::Chain(chain));

    println!("{}", serde_json::to_string_pretty(&actions).unwrap());
}
